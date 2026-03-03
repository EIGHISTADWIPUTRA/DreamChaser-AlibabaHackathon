import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { generateJSON } from "@/lib/alibaba/text";
import { buildBrainstormPrompt } from "@/lib/pipeline/promptBuilder";
import type { AIFeedback, SectionType } from "@/types";

export async function POST(request: NextRequest) {
    try {
        await getSessionUserId();

        const body = await request.json();
        const {
            sectionType,
            previousSections,
        }: {
            sectionType: SectionType;
            previousSections: { type: SectionType; text: string }[];
        } = body;

        if (!sectionType) {
            return NextResponse.json(
                { error: "Section type is required" },
                { status: 400 }
            );
        }

        const { system, user } = buildBrainstormPrompt(
            sectionType,
            previousSections ?? []
        );

        const result = await generateJSON<AIFeedback>(
            [{ role: "user", content: user }],
            system
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error("Brainstorm error:", error);
        return NextResponse.json(
            { error: "Failed to brainstorm" },
            { status: 500 }
        );
    }
}
