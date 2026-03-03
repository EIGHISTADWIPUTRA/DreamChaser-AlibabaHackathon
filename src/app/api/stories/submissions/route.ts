import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// Teacher-only: get all submitted + graded stories from teacher's classrooms
export async function GET() {
    try {
        const sessionUser = await getSessionUser();
        if (!sessionUser || sessionUser.role !== "TEACHER") {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        // Get the teacher's classrooms first
        const teacherClassrooms = await prisma.classroom.findMany({
            where: { teacherId: sessionUser.userId },
            select: { id: true },
        });
        const classroomIds = teacherClassrooms.map((c) => c.id);

        // Get stories from students in those classrooms
        const stories = await prisma.story.findMany({
            where: {
                status: { in: ["submitted", "graded"] },
                user: { classroomId: { in: classroomIds } },
            },
            include: {
                user: { select: { username: true, classroomId: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ stories });
    } catch (error) {
        console.error("Submissions error:", error);
        return NextResponse.json({ error: "Failed to load" }, { status: 500 });
    }
}
