import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import { dashscopePost } from "./client";

const WS_URL = "wss://dashscope-intl.aliyuncs.com/api-ws/v1/inference";
const TTS_MODEL = process.env.DASHSCOPE_TTS_MODEL ?? "cosyvoice-v3-flash";
const TTS_TIMEOUT = 60_000; // 60 seconds

// Default voice mapping per model family
const COSYVOICE_DEFAULT_VOICE = "longanyang";
const QWEN_TTS_DEFAULT_VOICE = "Cherry";

function isQwenTTSModel(model: string) {
    return model.toLowerCase().startsWith("qwen");
}

/** Qwen-TTS: uses the HTTP multimodal API, returns an audio URL */
async function generateSpeechQwenTTS(
    text: string,
    voice: string
): Promise<Buffer> {
    const effectiveVoice =
        voice === COSYVOICE_DEFAULT_VOICE ? QWEN_TTS_DEFAULT_VOICE : voice;

    const res = await dashscopePost(
        "/api/v1/services/aigc/multimodal-generation/generation",
        {
            model: TTS_MODEL,
            input: { text, voice: effectiveVoice },
            parameters: { format: "mp3", stream: false },
        }
    );

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Qwen TTS HTTP error ${res.status}: ${err}`);
    }

    const json = await res.json() as {
        output?: { audio?: { url?: string; data?: string } };
        code?: string;
        message?: string;
    };

    if (json.code) {
        throw new Error(`Qwen TTS failed: ${json.message ?? json.code}`);
    }

    const audioUrl = json.output?.audio?.url;
    const audioData = json.output?.audio?.data;

    if (audioData) {
        return Buffer.from(audioData, "base64");
    }

    if (!audioUrl) {
        throw new Error(`Qwen TTS returned no audio URL or data: ${JSON.stringify(json)}`);
    }

    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) {
        throw new Error(`Qwen TTS audio fetch failed: ${audioRes.status}`);
    }
    return Buffer.from(await audioRes.arrayBuffer());
}

export async function generateSpeech(
    text: string,
    voice = COSYVOICE_DEFAULT_VOICE
): Promise<Buffer> {
    if (isQwenTTSModel(TTS_MODEL)) {
        return generateSpeechQwenTTS(text, voice);
    }

    const apiKey = process.env.DASHSCOPE_API_KEY ?? "";
    const taskId = uuidv4();

    return new Promise<Buffer>((resolve, reject) => {
        const audioChunks: Buffer[] = [];
        let finished = false;

        const timeout = setTimeout(() => {
            if (!finished) {
                finished = true;
                ws.close();
                reject(new Error(`CosyVoice TTS timed out after ${TTS_TIMEOUT}ms`));
            }
        }, TTS_TIMEOUT);

        const ws = new WebSocket(WS_URL, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        ws.on("open", () => {
            // Step 1: Send run-task
            ws.send(
                JSON.stringify({
                    header: {
                        action: "run-task",
                        task_id: taskId,
                        streaming: "duplex",
                    },
                    payload: {
                        task_group: "audio",
                        task: "tts",
                        function: "SpeechSynthesizer",
                        model: TTS_MODEL,
                        parameters: {
                            text_type: "PlainText",
                            voice,
                            format: "mp3",
                            sample_rate: 22050,
                            volume: 50,
                            rate: 1.0,
                            pitch: 1.0,
                        },
                        input: {},
                    },
                })
            );
        });

        ws.on("message", (data: WebSocket.Data, isBinary: boolean) => {
            if (finished) return;

            if (isBinary) {
                audioChunks.push(Buffer.from(data as ArrayBuffer));
                return;
            }

            try {
                const msg = JSON.parse(data.toString());
                const event = msg.header?.event;

                if (event === "task-started") {
                    // Step 2: Send text via continue-task
                    ws.send(
                        JSON.stringify({
                            header: {
                                action: "continue-task",
                                task_id: taskId,
                            },
                            payload: {
                                input: { text },
                            },
                        })
                    );

                    // Step 3: Send finish-task to signal no more input
                    ws.send(
                        JSON.stringify({
                            header: {
                                action: "finish-task",
                                task_id: taskId,
                            },
                            payload: {
                                input: {},
                            },
                        })
                    );
                }

                if (event === "task-finished") {
                    finished = true;
                    clearTimeout(timeout);
                    ws.close();
                    resolve(Buffer.concat(audioChunks));
                }

                if (event === "task-failed") {
                    finished = true;
                    clearTimeout(timeout);
                    ws.close();
                    reject(
                        new Error(
                            `CosyVoice failed: ${msg.header?.error_message ?? JSON.stringify(msg)}`
                        )
                    );
                }
            } catch {
                // Non-JSON text message, ignore
            }
        });

        ws.on("error", (err) => {
            if (!finished) {
                finished = true;
                clearTimeout(timeout);
                reject(err);
            }
        });

        ws.on("close", () => {
            if (!finished) {
                finished = true;
                clearTimeout(timeout);
                if (audioChunks.length > 0) {
                    resolve(Buffer.concat(audioChunks));
                } else {
                    reject(new Error("CosyVoice WebSocket closed without finishing"));
                }
            }
        });
    });
}
