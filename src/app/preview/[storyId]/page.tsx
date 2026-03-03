"use client";

import { use } from "react";
import FlipbookViewer from "@/components/book/FlipbookViewer";

export default function PreviewPage({
    params,
}: {
    params: Promise<{ storyId: string }>;
}) {
    const { storyId } = use(params);
    const storyIdNum = parseInt(storyId);

    return <FlipbookViewer storyId={storyIdNum} />;
}
