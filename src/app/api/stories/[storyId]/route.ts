import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { unlink } from "fs/promises";
import path from "path";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ storyId: string }> }
) {
    try {
        const sessionUser = await getSessionUser();
        if (!sessionUser) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { storyId } = await params;
        const storyIdNum = parseInt(storyId);

        let story;
        if (sessionUser.role === "TEACHER") {
            // Teachers can only view stories from students in their classrooms
            const teacherClassrooms = await prisma.classroom.findMany({
                where: { teacherId: sessionUser.userId },
                select: { id: true },
            });
            const classroomIds = teacherClassrooms.map((c: { id: number }) => c.id);

            story = await prisma.story.findFirst({
                where: {
                    id: storyIdNum,
                    user: { classroomId: { in: classroomIds } },
                },
                include: {
                    sections: { orderBy: { sortOrder: "asc" } },
                    user: { select: { username: true } },
                },
            });
        } else {
            // Students can only view their own stories
            story = await prisma.story.findFirst({
                where: { id: storyIdNum, userId: sessionUser.userId },
                include: {
                    sections: { orderBy: { sortOrder: "asc" } },
                    user: { select: { username: true } },
                },
            });
        }

        if (!story) {
            return NextResponse.json({ error: "Story not found" }, { status: 404 });
        }

        return NextResponse.json({ story });
    } catch (error) {
        console.error("Story detail error:", error);
        return NextResponse.json({ error: "Failed to load story" }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ storyId: string }> }
) {
    try {
        const sessionUser = await getSessionUser();
        if (!sessionUser) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { storyId } = await params;
        const story = await prisma.story.findFirst({
            where: { id: parseInt(storyId), userId: sessionUser.userId },
            include: { sections: true },
        });

        if (!story) {
            return NextResponse.json({ error: "Story not found" }, { status: 404 });
        }

        // Delete media files from disk
        const uploadBase = path.join(process.cwd(), "public");
        for (const section of story.sections) {
            for (const url of [section.imageUrl, section.videoUrl, section.audioUrl]) {
                if (url) {
                    try {
                        await unlink(path.join(uploadBase, url));
                    } catch {
                        // File may not exist
                    }
                }
            }
        }

        // Cascade delete sections + story
        await prisma.story.delete({ where: { id: story.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Story delete error:", error);
        return NextResponse.json({ error: "Failed to delete story" }, { status: 500 });
    }
}
