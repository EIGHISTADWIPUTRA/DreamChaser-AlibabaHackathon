import { dashscopePost, pollTask } from "./client";

const IMAGE_MODEL = process.env.DASHSCOPE_IMAGE_MODEL ?? "wan2.1-t2i-turbo";

// Wan 2.6+ uses a different endpoint and request/response format.
// wan2.6-t2i → /services/aigc/image-generation/generation  (messages-style API)
// Older models → /services/aigc/text2image/image-synthesis   (prompt-style API)
const isWan2_6Plus = /wan2\.6|wan[3-9]/i.test(IMAGE_MODEL);

const IMAGE_ENDPOINT = isWan2_6Plus
    ? "/api/v1/services/aigc/image-generation/generation"
    : "/api/v1/services/aigc/text2image/image-synthesis";

// wan2.6-t2i requires total pixels between 1,638,400 (1280×1280) and 2,073,600 (1440×1440).
// 1152×1536 = 1,769,472 px at a 3:4 portrait ratio — valid for wan2.6.
// Legacy models are fine with the smaller 768×1024.
const DEFAULT_SIZE = isWan2_6Plus ? "1152*1536" : "768*1024";

export async function submitImageGeneration(
    prompt: string,
    negativePrompt?: string,
    size = DEFAULT_SIZE,
    style = "<auto>"
): Promise<string> {
    let body: Record<string, unknown>;

    if (isWan2_6Plus) {
        // Wan 2.6 uses a chat-style messages format — no `style` param
        body = {
            model: IMAGE_MODEL,
            input: {
                messages: [
                    {
                        role: "user",
                        content: [{ text: prompt }],
                    },
                ],
            },
            parameters: {
                size,
                n: 1,
                negative_prompt: negativePrompt ?? "blurry, low quality, text, watermark, ugly, deformed",
            },
        };
    } else {
        // Legacy wan2.1 / wanx style
        body = {
            model: IMAGE_MODEL,
            input: {
                prompt,
                negative_prompt: negativePrompt ?? "blurry, low quality, text, watermark, ugly, deformed",
            },
            parameters: {
                size,
                n: 1,
                style,
            },
        };
    }

    const res = await dashscopePost(
        IMAGE_ENDPOINT,
        body,
        { "X-DashScope-Async": "enable" }
    );

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Image submit error: ${res.status} ${errorText}`);
    }

    const json = await res.json();
    return json.output.task_id as string;
}

export async function waitForImage(taskId: string): Promise<string> {
    const result = await pollTask(taskId, 3000, 300000);

    // Wan 2.6+: output.choices[0].message.content[{type:"image", image:"url"}]
    // Legacy:   output.results[0].url
    if (isWan2_6Plus) {
        const content: Array<{ type: string; image?: string }> | undefined =
            result.choices?.[0]?.message?.content;
        const imageUrl = content?.find((c) => c.type === "image")?.image;
        if (!imageUrl) {
            throw new Error(`No image URL in wan2.6 task result: ${JSON.stringify(result)}`);
        }
        return imageUrl;
    }

    const imageUrl = result.results?.[0]?.url;
    if (!imageUrl) {
        throw new Error(`No image URL in task result: ${JSON.stringify(result)}`);
    }
    return imageUrl as string;
}

/**
 * Extract the image URL from a SUCCEEDED task result without throwing.
 * Returns null if no URL can be found.
 */
export function extractImageUrl(result: Record<string, unknown>): string | null {
    if (isWan2_6Plus) {
        type ContentItem = { type: string; image?: string };
        type Choice = { message: { content: ContentItem[] } };
        const content = (result.choices as Choice[])?.[0]?.message?.content;
        return content?.find((c) => c.type === "image")?.image ?? null;
    }
    type ImageResult = { url: string };
    return (result.results as ImageResult[])?.[0]?.url ?? null;
}
