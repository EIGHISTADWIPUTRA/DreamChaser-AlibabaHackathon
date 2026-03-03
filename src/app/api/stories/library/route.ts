import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Public endpoint - no auth required
// ?limit=5 for guests, no limit for authenticated users
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get("limit");
        const take = limitParam ? parseInt(limitParam) : undefined;

        const stories = await prisma.story.findMany({
            where: { status: "graded" },
            include: {
                user: { select: { username: true } },
                sections: {
                    select: { sectionType: true, imageUrl: true },
                    where: { sectionType: "title" },
                },
            },
            orderBy: { createdAt: "desc" },
            ...(take ? { take } : {}),
        });

        return NextResponse.json({ stories });
    } catch (error) {
        console.error("Library error:", error);
        return NextResponse.json({ error: "Failed to load library" }, { status: 500 });
    }
}
