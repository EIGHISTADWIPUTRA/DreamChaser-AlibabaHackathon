"use client";

import { use } from "react";
import NarrativeFormBuilder from "@/components/narrative/NarrativeFormBuilder";
import Sidebar from "@/components/layout/Sidebar";

export default function WritePage({
    params,
}: {
    params: Promise<{ storyId: string }>;
}) {
    const { storyId } = use(params);
    const storyIdNum = parseInt(storyId);

    return (
        <div className="flex h-screen">
            <Sidebar stories={[]} currentStoryId={storyIdNum} />
            <main className="flex-1 overflow-y-auto">
                <NarrativeFormBuilder storyId={storyIdNum} />
            </main>
        </div>
    );
}
