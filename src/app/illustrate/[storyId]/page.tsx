"use client";

import { use } from "react";
import IllustrationPipeline from "@/components/illustration/IllustrationPipeline";
import Sidebar from "@/components/layout/Sidebar";

export default function IllustratePage({
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
                <IllustrationPipeline storyId={storyIdNum} />
            </main>
        </div>
    );
}
