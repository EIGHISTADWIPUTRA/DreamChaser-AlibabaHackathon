import prisma from "@/lib/db";
import { unlink } from "fs/promises";
import path from "path";

export async function cleanupStaleDrafts(): Promise<{
    deleted: number;
    freedFiles: number;
}> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find stale draft stories
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
        // Delete files from disk
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

        // Delete story (cascades to sections)
        await prisma.story.delete({ where: { id: story.id } });
    }

    return { deleted: staleStories.length, freedFiles };
}
