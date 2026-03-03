"use client";

import { use } from "react";
import FinalizationProgress from "@/components/finalize/FinalizationProgress";
import Sidebar from "@/components/layout/Sidebar";

export default function FinalizePage({
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
                <FinalizationProgress storyId={storyIdNum} />
            </main>
        </div>
    );
}
