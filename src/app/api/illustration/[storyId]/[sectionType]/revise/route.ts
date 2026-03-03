import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { generateText } from "@/lib/alibaba/text";
import { buildBriefRevisionPrompt } from "@/lib/pipeline/promptBuilder";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ storyId: string; sectionType: string }> }
) {
    try {
        const userId = await getSessionUserId();
        if (!userId) {
            return NextResponse.json({ error: "Session not found" }, { status: 401 });
        }

        const { storyId, sectionType } = await params;
        const storyIdNum = parseInt(storyId);

        const story = await prisma.story.findFirst({
            where: { id: storyIdNum, userId },
            include: { sections: true },
        });

        if (!story) {
            return NextResponse.json({ error: "Story not found" }, { status: 404 });
        }

        const section = story.sections.find(
            (s) => s.sectionType === sectionType
        );
        if (!section) {
            return NextResponse.json({ error: "Section not found" }, { status: 404 });
        }

        const body = await request.json();
        const { currentBrief, revision } = body;

        if (!currentBrief || !revision) {
            return NextResponse.json(
                { error: "Current brief and revision are required" },
                { status: 400 }
            );
        }

        const { system, user } = buildBriefRevisionPrompt(currentBrief, revision);
        const revisedBrief = await generateText(system, user);

        // Update brief in DB
        await prisma.section.update({
            where: { id: section.id },
            data: { imagePromptBrief: revisedBrief },
        });

        return NextResponse.json({ brief: revisedBrief });
    } catch (error) {
        console.error("Brief revision error:", error);
        return NextResponse.json(
            { error: "Failed to revise brief" },
            { status: 500 }
        );
    }
}
