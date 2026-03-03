import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// POST: Student joins a classroom by entering the class code
export async function POST(request: NextRequest) {
    try {
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        if (user.role !== "STUDENT") {
            return NextResponse.json({ error: "Only students can join classes" }, { status: 403 });
        }

        const { classCode } = await request.json();
        if (!classCode || classCode.trim().length === 0) {
            return NextResponse.json({ error: "Class code is required" }, { status: 400 });
        }

        const classroom = await prisma.classroom.findUnique({
            where: { classCode: classCode.trim().toUpperCase() },
        });

        if (!classroom) {
            return NextResponse.json({ error: "Invalid class code. Please check with your teacher." }, { status: 404 });
        }

        // Update the student's classroomId
        await prisma.user.update({
            where: { id: user.userId },
            data: { classroomId: classroom.id },
        });

        return NextResponse.json({
            success: true,
            classroom: { id: classroom.id, name: classroom.name },
        });
    } catch (error) {
        console.error("Join class error:", error);
        return NextResponse.json({ error: "Failed to join class" }, { status: 500 });
    }
}
