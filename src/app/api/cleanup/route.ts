import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE() {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Find stale drafting stories
        const staleStories = await prisma.story.findMany({
            where: {
                status: "drafting",
                createdAt: { lt: twentyFourHoursAgo },
            },
            include: { sections: true },
        });

        let freedFiles = 0;
        const uploadBase = path.join(process.cwd(), "public");

        for (const story of staleStories) {
            for (const section of story.sections) {
                for (const url of [section.imageUrl, section.videoUrl, section.audioUrl]) {
                    if (url) {
                        try {
                            await unlink(path.join(uploadBase, url));
                            freedFiles++;
                        } catch {
                            // File may already be deleted
                        }
                    }
                }
            }
            await prisma.story.delete({ where: { id: story.id } });
        }

        return NextResponse.json({ deleted: staleStories.length, freedFiles });
    } catch (error) {
        console.error("Cleanup error:", error);
        return NextResponse.json(
            { error: "Failed to clean up" },
            { status: 500 }
        );
    }
}
