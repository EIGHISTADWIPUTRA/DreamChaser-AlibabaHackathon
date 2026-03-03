import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { generateJSON } from "@/lib/alibaba/text";
import { buildStructureCheckPrompt } from "@/lib/pipeline/promptBuilder";
import type { AIFeedback, SectionType } from "@/types";

export async function POST(request: NextRequest) {
    try {
        await getSessionUserId();

        const body = await request.json();
        const {
            sectionType,
            currentText,
            previousSections,
        }: {
            sectionType: SectionType;
            currentText: string;
            previousSections: { type: SectionType; text: string }[];
        } = body;

        if (!sectionType || !currentText?.trim()) {
            return NextResponse.json(
                { error: "Section type and text are required" },
                { status: 400 }
            );
        }

        const { system, user } = buildStructureCheckPrompt(
            sectionType,
            currentText,
            previousSections ?? []
        );

        const result = await generateJSON<AIFeedback>(
            [{ role: "user", content: user }],
            system
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error("Structure check error:", error);
        return NextResponse.json(
            { error: "Failed to check structure" },
            { status: 500 }
        );
    }
}
