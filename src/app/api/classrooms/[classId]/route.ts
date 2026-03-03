import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/session";

// GET: Class detail with students + their submitted stories
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ classId: string }> }
) {
    try {
        const user = await getSessionUser();
        if (!user || user.role !== "TEACHER") {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const { classId } = await params;
        const classIdNum = parseInt(classId);

        const classroom = await prisma.classroom.findFirst({
            where: { id: classIdNum, teacherId: user.userId },
            include: {
                students: {
                    select: {
                        id: true,
                        username: true,
                        createdAt: true,
                        stories: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                                teacherGrade: true,
                                createdAt: true,
                            },
                            orderBy: { createdAt: "desc" },
                        },
                    },
                },
            },
        });

        if (!classroom) {
            return NextResponse.json({ error: "Class not found" }, { status: 404 });
        }

        return NextResponse.json({ classroom });
    } catch (error) {
        console.error("Class detail error:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

// DELETE: Remove a classroom (unenrolls all students first)
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ classId: string }> }
) {
    try {
        const user = await getSessionUser();
        if (!user || user.role !== "TEACHER") {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const { classId } = await params;
        const classIdNum = parseInt(classId);

        // Verify ownership
        const classroom = await prisma.classroom.findFirst({
            where: { id: classIdNum, teacherId: user.userId },
        });
        if (!classroom) {
            return NextResponse.json({ error: "Class not found" }, { status: 404 });
        }

        // Unenroll all students (set classroomId to null)
        await prisma.user.updateMany({
            where: { classroomId: classIdNum },
            data: { classroomId: null },
        });

        // Delete the classroom
        await prisma.classroom.delete({ where: { id: classIdNum } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete classroom error:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
