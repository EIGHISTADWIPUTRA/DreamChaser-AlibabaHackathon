import { dashscopePost } from "./client";

const TEXT_MODEL = process.env.DASHSCOPE_TEXT_MODEL ?? "qwen3.5-flash";

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export async function generateJSON<T>(
    messages: ChatMessage[],
    systemPrompt: string
): Promise<T> {
    const allMessages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...messages,
    ];

    const res = await dashscopePost("/compatible-mode/v1/chat/completions", {
        model: TEXT_MODEL,
        messages: allMessages,
        response_format: { type: "json_object" },
        temperature: 0.7,
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Qwen JSON API error: ${res.status} ${errorText}`);
    }

    const json = await res.json();
    const content: string = json.choices[0].message.content;

    return JSON.parse(content) as T;
}

export async function generateText(
    systemPrompt: string,
    userMessage: string
): Promise<string> {
    const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
    ];

    const res = await dashscopePost("/compatible-mode/v1/chat/completions", {
        model: TEXT_MODEL,
        messages,
        temperature: 0.7,
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Qwen API error: ${res.status} ${errorText}`);
    }

    const json = await res.json();
    return json.choices[0].message.content as string;
}
