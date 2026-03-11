import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { submitImageGeneration } from "@/lib/alibaba/image";

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
                { error: "No image found for this section." },
                { status: 400 }
            );
        }

        // Already completed
        if (section.videoUrl) {
            return NextResponse.json({ status: "completed", videoUrl: section.videoUrl });
        }

        // Already a job in progress — do not start a second one
        if (section.videoJobId) {
            return NextResponse.json({ status: "processing" });
        }

        // Submit the image re-generation to obtain a DashScope-hosted URL
        // accessible by Wan2.1 I2V, then immediately return.
        const imageTaskId = await submitImageGeneration(section.imagePromptBrief ?? "");

        await prisma.section.update({
            where: { id: section.id },
            data: { videoJobId: `img:${imageTaskId}` },
        });

        return NextResponse.json({ status: "processing" });
    } catch (error) {
        console.error("Video generation start error:", error);
        return NextResponse.json(
            { error: "Failed to start video generation: " + (error as Error).message },
            { status: 500 }
        );
    }
}
