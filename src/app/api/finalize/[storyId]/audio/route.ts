import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { generateSpeech } from "@/lib/alibaba/speech";
import { saveBuffer } from "@/lib/utils/fileStorage";
import type { SectionType } from "@/types";
import { SECTION_ORDER } from "@/types";

export const maxDuration = 120;

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ storyId: string }> }
) {
    try {
        const userId = await getSessionUserId();
        if (!userId) {
            return NextResponse.json({ error: "Session not found" }, { status: 401 });
        }

        const { storyId } = await params;
        const storyIdNum = parseInt(storyId);

        const story = await prisma.story.findFirst({
            where: { id: storyIdNum, userId },
            include: { sections: { orderBy: { sortOrder: "asc" } } },
        });

        if (!story) {
            return NextResponse.json({ error: "Story not found" }, { status: 404 });
        }

        const body = await request.json();
        const { sectionType }: { sectionType: SectionType } = body;

        if (!sectionType) {
            return NextResponse.json(
                { error: "Section type is required" },
                { status: 400 }
            );
        }

        const section = story.sections.find(
            (s) => s.sectionType === sectionType
        );
        if (!section || !section.textContent) {
            return NextResponse.json(
                { error: "Section not found or has no text" },
                { status: 400 }
            );
        }

        // Generate speech using CosyVoice
        const audioBuffer = await generateSpeech(section.textContent);

        // Save audio file
        const filename = `story-${storyIdNum}-${sectionType}.mp3`;
        const localAudioUrl = await saveBuffer(audioBuffer, "audio", filename);

        // Update section
        await prisma.section.update({
            where: { id: section.id },
            data: { audioUrl: localAudioUrl },
        });

        // Check if all sections now have audio
        const allSections = await prisma.section.findMany({
            where: { storyId: storyIdNum },
        });
        const allHaveAudio = allSections.every((s) => s.audioUrl);

        if (allHaveAudio) {
            await prisma.story.update({
                where: { id: storyIdNum },
                data: { status: "completed" },
            });
        }

        return NextResponse.json({
            audioUrl: localAudioUrl,
            allComplete: allHaveAudio,
        });
    } catch (error) {
        console.error("Audio generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate audio: " + (error as Error).message },
            { status: 500 }
        );
    }
}
