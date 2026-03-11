import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { checkTask } from "@/lib/alibaba/client";
import { submitVideoGeneration } from "@/lib/alibaba/video";
import { submitImageGeneration, extractImageUrl } from "@/lib/alibaba/image";
import { downloadAndSave } from "@/lib/utils/fileStorage";
import { buildVideoAnimationPrompt } from "@/lib/pipeline/promptBuilder";

export async function GET(
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

        const section = story.sections.find((s) => s.sectionType === sectionType);
        if (!section) {
            return NextResponse.json({ error: "Section not found" }, { status: 404 });
        }

        // Already completed
        if (section.videoUrl) {
            return NextResponse.json({ status: "completed", videoUrl: section.videoUrl });
        }

        const jobId = section.videoJobId;
        if (!jobId) {
            return NextResponse.json({ status: "idle" });
        }

        // ── Phase 0: Queued — kick off image generation ────────────────────────
        if (jobId === "queued") {
            const imageTaskId = await submitImageGeneration(section.imagePromptBrief ?? "");
            await prisma.section.update({
                where: { id: section.id },
                data: { videoJobId: `img:${imageTaskId}` },
            });
            return NextResponse.json({ status: "processing" });
        }

        // ── Phase 1: Waiting for image generation ──────────────────────────────
        if (jobId.startsWith("img:")) {
            const imageTaskId = jobId.slice(4);
            const task = await checkTask(imageTaskId);

            if (task.task_status === "SUCCEEDED") {
                const imageUrl = extractImageUrl(task);
                if (!imageUrl) {
                    await prisma.section.update({
                        where: { id: section.id },
                        data: { videoJobId: null },
                    });
                    return NextResponse.json({
                        status: "failed",
                        error: "Image generation produced no URL.",
                    });
                }

                // Advance pipeline: submit video generation
                const videoPrompt = buildVideoAnimationPrompt(
                    sectionType,
                    story.artStyle ?? "storybook"
                );
                const videoTaskId = await submitVideoGeneration(imageUrl, videoPrompt);

                await prisma.section.updateMany({
                    where: { id: section.id, videoJobId: jobId },
                    data: { videoJobId: `vid:${videoTaskId}` },
                });

                return NextResponse.json({ status: "processing" });
            }

            if (task.task_status === "FAILED") {
                await prisma.section.update({
                    where: { id: section.id },
                    data: { videoJobId: null },
                });
                return NextResponse.json({
                    status: "failed",
                    error: "Image generation failed. Please try again.",
                });
            }

            // PENDING or RUNNING
            return NextResponse.json({ status: "processing" });
        }

        // ── Phase 2: Waiting for video generation ──────────────────────────────
        if (jobId.startsWith("vid:")) {
            const videoTaskId = jobId.slice(4);
            const task = await checkTask(videoTaskId);

            if (task.task_status === "SUCCEEDED") {
                const remoteVideoUrl = task.video_url as string | undefined;
                if (!remoteVideoUrl) {
                    await prisma.section.update({
                        where: { id: section.id },
                        data: { videoJobId: null },
                    });
                    return NextResponse.json({
                        status: "failed",
                        error: "Video generation produced no URL.",
                    });
                }

                const filename = `story-${storyIdNum}-${sectionType}.mp4`;
                const localVideoUrl = await downloadAndSave(
                    remoteVideoUrl,
                    "videos",
                    filename
                );

                await prisma.section.update({
                    where: { id: section.id },
                    data: { videoUrl: localVideoUrl, videoJobId: null },
                });

                return NextResponse.json({ status: "completed", videoUrl: localVideoUrl });
            }

            if (task.task_status === "FAILED") {
                await prisma.section.update({
                    where: { id: section.id },
                    data: { videoJobId: null },
                });
                return NextResponse.json({
                    status: "failed",
                    error: "Video generation failed. Please try again.",
                });
            }

            // PENDING or RUNNING
            return NextResponse.json({ status: "processing" });
        }

        // Unknown job format — reset
        await prisma.section.update({
            where: { id: section.id },
            data: { videoJobId: null },
        });
        return NextResponse.json({ status: "idle" });
    } catch (error) {
        console.error("Video status check error:", error);
        return NextResponse.json(
            { error: "Status check failed: " + (error as Error).message },
            { status: 500 }
        );
    }
}
