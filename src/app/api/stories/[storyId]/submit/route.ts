import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ storyId: string }> }
) {
    try {
        const userId = await getSessionUserId();
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { storyId } = await params;
        const storyIdNum = parseInt(storyId);

        const story = await prisma.story.findFirst({
            where: { id: storyIdNum, userId },
        });

        if (!story) {
            return NextResponse.json({ error: "Story not found" }, { status: 404 });
        }

        if (story.status !== "completed") {
            return NextResponse.json(
                { error: "Only completed stories can be submitted" },
                { status: 400 }
            );
        }

        await prisma.story.update({
            where: { id: storyIdNum },
            data: { status: "submitted" },
        });

        return NextResponse.json({ success: true, status: "submitted" });
    } catch (error) {
        console.error("Submit error:", error);
        return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
    }
}
