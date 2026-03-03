import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { submitImageGeneration, waitForImage } from "@/lib/alibaba/image";
import { downloadAndSave } from "@/lib/utils/fileStorage";

export const maxDuration = 300;

// Dynamic style suffix based on user's selected art style (restricted to 2 styles)
function getStyleSuffix(requestedStyle: string): string {
    const style = requestedStyle.toLowerCase();

    if (style.includes("photorealism")) {
        return "\n[Art Style]: Hyper-realistic photograph, 8k resolution, cinematic lighting, photorealism, ultra-detailed, lifelike.";
    }
    // Default to 3D Cartoon
    return "\n[Art Style]: 3D Pixar style, unreal engine 5 render, soft shadows, cute 3d animation style, vibrant colors, clean background.";
}

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

        // Read optional style from request body
        let style = "<auto>";
        try {
            const body = await request.json();
            if (body.style) style = body.style;
        } catch {
            // No body or invalid JSON — use default style
        }

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
        if (!section || !section.imagePromptBrief) {
            return NextResponse.json(
                { error: "No image brief found. Generate a brief first." },
                { status: 400 }
            );
        }

        // Inject dynamic art style suffix based on user's selection
        const dynamicStyleSuffix = getStyleSuffix(style);
        const finalPromptForImage = `${section.imagePromptBrief}${dynamicStyleSuffix}`;

        console.log(`[Image Gen] Style: ${style}, Prompt: ${finalPromptForImage.substring(0, 120)}...`);

        // Submit image generation with structured tag prompt + dynamic style
        const taskId = await submitImageGeneration(
            finalPromptForImage,
            undefined,
            undefined,
            style
        );
        const remoteImageUrl = await waitForImage(taskId);

        // Download to local storage
        const filename = `story-${storyIdNum}-${sectionType}-${Date.now()}.png`;
        const localImageUrl = await downloadAndSave(
            remoteImageUrl,
            "images",
            filename
        );

        // Update section image + persist the chosen art style on the story
        await prisma.$transaction([
            prisma.section.update({
                where: { id: section.id },
                data: { imageUrl: localImageUrl },
            }),
            prisma.story.update({
                where: { id: storyIdNum },
                data: { artStyle: style },
            }),
        ]);

        return NextResponse.json({ imageUrl: localImageUrl });
    } catch (error) {
        console.error("Image generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate image: " + (error as Error).message },
            { status: 500 }
        );
    }
}
