import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUserId } from "@/lib/session";
import { SECTION_ORDER } from "@/types";
import type { SectionType } from "@/types";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ storyId: string; sectionType: string }> }
) {
    try {
        const userId = await getSessionUserId();
        if (!userId) {
            return NextResponse.json({ error: "Session not found" }, { status: 401 });
        }

        const { storyId, sectionType } = await params;
        const storyIdNum = parseInt(storyId);

        // Validate sectionType
        const validTypes = SECTION_ORDER.map((s) => s.type);
        if (!validTypes.includes(sectionType as SectionType)) {
            return NextResponse.json({ error: "Invalid section type" }, { status: 400 });
        }

        // Verify story ownership
        const story = await prisma.story.findFirst({
            where: { id: storyIdNum, userId },
            include: { sections: { orderBy: { sortOrder: "asc" } } },
        });

        if (!story) {
            return NextResponse.json({ error: "Story not found" }, { status: 404 });
        }

        const body = await request.json();
        const { textContent, isLocked } = body;

        const currentSection = story.sections.find(
            (s) => s.sectionType === sectionType
        );
        if (!currentSection) {
            return NextResponse.json({ error: "Section not found" }, { status: 404 });
        }

        // ── Lock validation ────────────────────────────────
        if (isLocked === true) {
            // Cannot lock if text is empty
            if (!(textContent ?? currentSection.textContent)?.trim()) {
                return NextResponse.json(
                    { error: "Cannot lock an empty section" },
                    { status: 400 }
                );
            }

            // Cannot lock unless all previous sections are locked
            const previousSections = story.sections.filter(
                (s) => s.sortOrder < currentSection.sortOrder
            );
            const allPreviousLocked = previousSections.every((s) => s.isLocked);
            if (!allPreviousLocked) {
                return NextResponse.json(
                    { error: "Previous sections must be locked first" },
                    { status: 400 }
                );
            }
        }

        // ── Unlock cascade ─────────────────────────────────
        if (isLocked === false) {
            // Unlock this section AND all subsequent sections
            await prisma.section.updateMany({
                where: {
                    storyId: storyIdNum,
                    sortOrder: { gte: currentSection.sortOrder },
                },
                data: { isLocked: false },
            });
        }

        // Update the section
        const updateData: Record<string, unknown> = {};
        if (textContent !== undefined) updateData.textContent = textContent;
        if (isLocked !== undefined) updateData.isLocked = isLocked;

        // If this is the title section, also update story.title
        if (sectionType === "title" && textContent !== undefined) {
            await prisma.story.update({
                where: { id: storyIdNum },
                data: { title: textContent },
            });
        }

        const updatedSection = await prisma.section.update({
            where: { id: currentSection.id },
            data: updateData,
        });

        // Re-fetch all sections to return current state
        const allSections = await prisma.section.findMany({
            where: { storyId: storyIdNum },
            orderBy: { sortOrder: "asc" },
        });

        return NextResponse.json({ section: updatedSection, allSections });
    } catch (error) {
        console.error("Section update error:", error);
        return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
    }
}
