import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { generateText } from "@/lib/alibaba/text";
import {
    buildIllustrationBriefPrompt,
    buildCoverBriefPrompt,
} from "@/lib/pipeline/promptBuilder";
import type { SectionType } from "@/types";

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ storyId: string; sectionType: string }> }
) {
    try {
        const userId = await getSessionUserId();
        if (!userId) {
            return NextResponse.json({ error: "Session not found" }, { status: 401 });
        }

        const { storyId, sectionType } = await params;
        const storyIdNum = parseInt(storyId);

        // Verify story ownership
        const story = await prisma.story.findFirst({
            where: { id: storyIdNum, userId },
            include: { sections: { orderBy: { sortOrder: "asc" } } },
        });

        if (!story) {
            return NextResponse.json({ error: "Story not found" }, { status: 404 });
        }

        const currentSection = story.sections.find(
            (s) => s.sectionType === sectionType
        );
        if (!currentSection) {
            return NextResponse.json({ error: "Section not found" }, { status: 404 });
        }

        // Gather previously illustrated briefs — extract [Characters] lines for consistency
        const previousBriefsText = story.sections
            .filter(
                (s) =>
                    s.isIllustrated &&
                    s.imagePromptBrief &&
                    s.sectionType !== sectionType
            )
            .map((s) => {
                // Extract the [Character Details] tag from previous briefs for copy-paste consistency
                const charMatch = s.imagePromptBrief!.match(/\[Character Details\]:\s*(.+)/i);
                return charMatch ? charMatch[1].trim() : s.imagePromptBrief!;
            })
            .join("\n");

        let brief: string;

        if (sectionType === "title") {
            // Cover/title is generated last — reads entire story
            const fullStoryText = story.sections
                .filter((s) => s.sectionType !== "title" && s.textContent)
                .map((s) => `[${s.sectionType.toUpperCase()}]\n${s.textContent}`)
                .join("\n\n");

            const { system, user } = buildCoverBriefPrompt(
                story.title,
                fullStoryText,
                previousBriefsText
            );
            brief = await generateText(system, user);
        } else {
            const { system, user } = buildIllustrationBriefPrompt(
                sectionType as SectionType,
                currentSection.textContent,
                previousBriefsText
            );
            brief = await generateText(system, user);
        }

        // Save brief to DB
        await prisma.section.update({
            where: { id: currentSection.id },
            data: { imagePromptBrief: brief },
        });

        return NextResponse.json({ brief });
    } catch (error) {
        console.error("Brief generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate brief" },
            { status: 500 }
        );
    }
}
