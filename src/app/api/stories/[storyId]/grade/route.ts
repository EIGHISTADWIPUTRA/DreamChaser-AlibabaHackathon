import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ storyId: string }> }
) {
    try {
        const sessionUser = await getSessionUser();
        if (!sessionUser) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        if (sessionUser.role !== "TEACHER") {
            return NextResponse.json({ error: "Only teachers can grade" }, { status: 403 });
        }

        const { storyId } = await params;
        const storyIdNum = parseInt(storyId);

        // Verify the story belongs to a student in this teacher's classrooms
        const teacherClassrooms = await prisma.classroom.findMany({
            where: { teacherId: sessionUser.userId },
            select: { id: true },
        });
        const classroomIds = teacherClassrooms.map((c: { id: number }) => c.id);

        const story = await prisma.story.findFirst({
            where: {
                id: storyIdNum,
                status: "submitted",
                user: { classroomId: { in: classroomIds } },
            },
        });

        if (!story) {
            return NextResponse.json({ error: "Story not found, not submitted, or not in your classroom" }, { status: 404 });
        }

        const body = await request.json();
        const { grade, feedback } = body;

        if (grade === undefined || grade === null) {
            return NextResponse.json({ error: "Grade is required" }, { status: 400 });
        }

        await prisma.story.update({
            where: { id: storyIdNum },
            data: {
                status: "graded",
                teacherGrade: parseInt(grade),
                teacherFeedback: feedback || null,
            },
        });

        return NextResponse.json({ success: true, status: "graded" });
    } catch (error) {
        console.error("Grade error:", error);
        return NextResponse.json({ error: "Failed to grade" }, { status: 500 });
    }
}
