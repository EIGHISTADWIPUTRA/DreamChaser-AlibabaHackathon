import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// Session endpoint - returns current user info
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ userId: null, role: null, classroomId: null });
        }

        const userId = parseInt(session.user.id!);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { classroomId: true },
        });

        return NextResponse.json({
            userId,
            username: session.user.name,
            role: (session.user as { role?: string }).role,
            classroomId: user?.classroomId ?? null,
        });
    } catch (error) {
        console.error("Session error:", error);
        return NextResponse.json({ userId: null, role: null, classroomId: null });
    }
}
