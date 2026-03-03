import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { generateJSON } from "@/lib/alibaba/text";
import { buildGrammarCheckPrompt } from "@/lib/pipeline/promptBuilder";
import type { AIFeedback } from "@/types";

export async function POST(request: NextRequest) {
    try {
        await getSessionUserId();

        const body = await request.json();
        const { text }: { text: string } = body;

        if (!text?.trim()) {
            return NextResponse.json(
                { error: "Text is required" },
                { status: 400 }
            );
        }

        const { system, user } = buildGrammarCheckPrompt(text);

        const result = await generateJSON<AIFeedback>(
            [{ role: "user", content: user }],
            system
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error("Grammar check error:", error);
        return NextResponse.json(
            { error: "Failed to check grammar" },
            { status: 500 }
        );
    }
}
