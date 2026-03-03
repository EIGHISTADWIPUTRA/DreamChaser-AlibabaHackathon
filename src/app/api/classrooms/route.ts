import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/session";

function generateClassCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// GET: List teacher's classrooms
export async function GET() {
    try {
        const user = await getSessionUser();
        if (!user || user.role !== "TEACHER") {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const classrooms = await prisma.classroom.findMany({
            where: { teacherId: user.userId },
            include: {
                _count: { select: { students: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ classrooms });
    } catch (error) {
        console.error("Classrooms list error:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

// POST: Create a new classroom
export async function POST(request: NextRequest) {
    try {
        const user = await getSessionUser();
        if (!user || user.role !== "TEACHER") {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const { name } = await request.json();
        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: "Class name is required" }, { status: 400 });
        }

        // Generate unique code with retry
        let classCode = generateClassCode();
        let attempts = 0;
        while (attempts < 10) {
            const existing = await prisma.classroom.findUnique({ where: { classCode } });
            if (!existing) break;
            classCode = generateClassCode();
            attempts++;
        }

        const classroom = await prisma.classroom.create({
            data: {
                name: name.trim(),
                classCode,
                teacherId: user.userId,
            },
        });

        return NextResponse.json({ classroom });
    } catch (error) {
        console.error("Create classroom error:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
