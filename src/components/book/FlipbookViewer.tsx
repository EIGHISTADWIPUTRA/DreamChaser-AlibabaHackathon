"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import HTMLFlipBook from "react-pageflip";
import CoverPage from "@/components/book/CoverPage";
import { ImagePage, TextPage } from "@/components/book/StorySpread";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SectionData } from "@/types";
import { SECTION_ORDER } from "@/types";

interface FlipbookViewerProps {
    storyId: number;
}

export default function FlipbookViewer({ storyId }: FlipbookViewerProps) {
    const [sections, setSections] = useState<SectionData[]>([]);
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flipBookRef = useRef<any>(null);

    useEffect(() => {
        async function fetchStory() {
            try {
                const res = await fetch(`/api/stories/${storyId}`);
                if (!res.ok) throw new Error("Failed to load story");
                const data = await res.json();
                setSections(data.story.sections);
                setTitle(data.story.title);
            } finally {
                setLoading(false);
            }
        }
        fetchStory();
    }, [storyId]);

    const onFlip = useCallback((e: { data: number }) => {
        setCurrentPage(e.data);
        // Pause all playing media when page flips
        document.querySelectorAll("audio, video").forEach((el) => {
            const media = el as HTMLMediaElement;
            if (!media.paused) {
                media.pause();
                media.currentTime = 0;
            }
        });
    }, []);

    const goNext = () => {
        flipBookRef.current?.pageFlip()?.flipNext();
    };
    const goPrev = () => {
        flipBookRef.current?.pageFlip()?.flipPrev();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-b from-amber-50 to-amber-100">
                <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
            </div>
        );
    }

    // Section data lookup
    const titleSection = sections.find((s) => s.sectionType === "title");
    const bodySections = ["orientation", "complication", "resolution", "reorientation"]
        .map((type) => sections.find((s) => s.sectionType === type))
        .filter(Boolean) as SectionData[];

    const titleImageUrl = titleSection?.imageUrl || null;
    const totalPages = 10;

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center py-8 px-4">
            {/* Title */}
            <h1 className="text-xl font-bold text-slate-800 mb-6 tracking-tight">
                {title || "Untitled Story"}
            </h1>

            {/* Flipbook container — wide enough for 2-page spread */}
            <div className="max-w-5xl w-full flex justify-center items-center">
                <HTMLFlipBook
                    ref={flipBookRef}
                    width={450}
                    height={600}
                    size="stretch"
                    minWidth={300}
                    maxWidth={500}
                    minHeight={400}
                    maxHeight={700}
                    showCover={true}
                    flippingTime={800}
                    useMouseEvents={true}
                    className="mx-auto shadow-2xl"
                    style={{ margin: "0 auto" }}
                    startPage={0}
                    drawShadow={true}
                    maxShadowOpacity={0.4}
                    mobileScrollSupport={true}
                    onFlip={onFlip}
                    startZIndex={0}
                    autoSize={true}
                    clickEventForward={false}
                    usePortrait={false}
                    swipeDistance={30}
                    showPageCorners={true}
                    disableFlipByClick={true}
                >
                    {/* Page 1: Front Cover (full-bleed) */}
                    <CoverPage
                        title={title}
                        imageUrl={titleImageUrl}
                    />

                    {/* Pages 2-9: Story Spreads (4 sections × 2 pages each) */}
                    {bodySections.map((section, idx) => {
                        const label =
                            SECTION_ORDER.find((s) => s.type === section.sectionType)?.label ??
                            section.sectionType;
                        // Even index pages (2,4,6,8) are left pages; odd (3,5,7,9) are right
                        const pageNum = 2 + idx * 2;
                        return [
                            <ImagePage
                                key={`img-${section.sectionType}`}
                                storyId={storyId}
                                sectionType={section.sectionType}
                                imageUrl={section.imageUrl}
                                videoUrl={section.videoUrl}
                                pagePosition="left"
                            />,
                            <TextPage
                                key={`txt-${section.sectionType}`}
                                sectionLabel={label}
                                textContent={section.textContent}
                                audioUrl={section.audioUrl}
                                pagePosition="right"
                                pageNumber={pageNum + 1}
                            />,
                        ];
                    }).flat()}

                    {/* Page 10: Back Cover (full-bleed) */}
                    <CoverPage
                        title={title}
                        imageUrl={titleImageUrl}
                        isBack
                    />
                </HTMLFlipBook>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mt-6">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={goPrev}
                    disabled={currentPage <= 0}
                    className="rounded-full h-10 w-10 border-2 border-orange-200 hover:bg-orange-50"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <span className="text-sm text-slate-500 min-w-[80px] text-center">
                    Page {currentPage + 1} / {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={goNext}
                    disabled={currentPage >= totalPages - 1}
                    className="rounded-full h-10 w-10 border-2 border-orange-200 hover:bg-orange-50"
                >
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>

            {/* Hint */}
            <p className="text-xs text-slate-400 mt-3">
                Drag the page corners to flip • Click images to animate • Click text to hear audio
            </p>
        </div>
    );
}
