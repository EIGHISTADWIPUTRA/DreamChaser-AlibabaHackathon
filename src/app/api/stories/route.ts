import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { SECTION_ORDER } from "@/types";

export async function GET() {
    try {
        const userId = await getSessionUserId();
        if (!userId) {
            return NextResponse.json({ error: "Session not found" }, { status: 401 });
        }

        const stories = await prisma.story.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                status: true,
                teacherGrade: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ stories });
    } catch (error) {
        console.error("Stories list error:", error);
        return NextResponse.json({ error: "Failed to load stories" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = await getSessionUserId();
        if (!userId) {
            return NextResponse.json({ error: "Session not found" }, { status: 401 });
        }

        const body = await request.json();
        const { title } = body;

        const story = await prisma.story.create({
            data: {
                userId,
                title: title || "",
                status: "drafting",
                sections: {
                    create: SECTION_ORDER.map((s) => ({
                        sectionType: s.type,
                        sortOrder: s.sortOrder,
                        textContent: "",
                        isLocked: false,
                    })),
                },
            },
            include: {
                sections: { orderBy: { sortOrder: "asc" } },
            },
        });

        return NextResponse.json({ story });
    } catch (error) {
        console.error("Story create error:", error);
        return NextResponse.json({ error: "Failed to create story" }, { status: 500 });
    }
}
