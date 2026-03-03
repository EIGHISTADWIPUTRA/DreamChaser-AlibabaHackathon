import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { submitVideoGeneration, waitForVideo } from "@/lib/alibaba/video";
import { submitImageGeneration, waitForImage } from "@/lib/alibaba/image";
import { downloadAndSave } from "@/lib/utils/fileStorage";
import { buildVideoAnimationPrompt } from "@/lib/pipeline/promptBuilder";

export const maxDuration = 600;

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

        // Already has video?
        if (section.videoUrl) {
            return NextResponse.json({ videoUrl: section.videoUrl });
        }

        // Build style-aware cinematic motion prompt using the persisted art style
        const videoPrompt = buildVideoAnimationPrompt(sectionType, story.artStyle ?? "storybook");

        // Re-generate image to get a DashScope-hosted URL accessible by Wan2.1 I2V
        const imageTaskId = await submitImageGeneration(section.imagePromptBrief ?? "");
        const remoteImageUrl = await waitForImage(imageTaskId);

        // Submit video generation
        const videoTaskId = await submitVideoGeneration(remoteImageUrl, videoPrompt);
        const remoteVideoUrl = await waitForVideo(videoTaskId);

        // Download video locally
        const filename = `story-${storyIdNum}-${sectionType}.mp4`;
        const localVideoUrl = await downloadAndSave(
            remoteVideoUrl,
            "videos",
            filename
        );

        // Save to DB
        await prisma.section.update({
            where: { id: section.id },
            data: { videoUrl: localVideoUrl },
        });

        return NextResponse.json({ videoUrl: localVideoUrl });
    } catch (error) {
        console.error("On-demand video error:", error);
        return NextResponse.json(
            { error: "Failed to generate video: " + (error as Error).message },
            { status: 500 }
        );
    }
}
