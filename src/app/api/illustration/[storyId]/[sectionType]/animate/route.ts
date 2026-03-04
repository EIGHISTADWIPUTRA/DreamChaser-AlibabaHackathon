import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export const maxDuration = 300;

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
        if (!section || !section.imageUrl) {
            return NextResponse.json(
                { error: "No image found. Generate the image first." },
                { status: 400 }
            );
        }

        // Lock the image only — no video generation
        await prisma.section.update({
            where: { id: section.id },
            data: { isIllustrated: true },
        });

        // Check if all sections are now illustrated
        const allSections = await prisma.section.findMany({
            where: { storyId: storyIdNum },
        });
        const allIllustrated = allSections.every((s) => s.isIllustrated);

        if (allIllustrated) {
            await prisma.story.update({
                where: { id: storyIdNum },
                data: { status: "finalizing" },
            });
        }

        return NextResponse.json({
            success: true,
            allIllustrated,
        });
    } catch (error) {
        console.error("Lock image error:", error);
        return NextResponse.json(
            { error: "Failed to lock image: " + (error as Error).message },
            { status: 500 }
        );
    }
}
