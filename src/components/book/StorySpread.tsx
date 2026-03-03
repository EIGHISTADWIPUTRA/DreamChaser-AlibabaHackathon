"use client";

import React, { useRef, useState } from "react";
import OnDemandVideoPlayer from "@/components/book/OnDemandVideoPlayer";
import BookPageWrapper from "@/components/book/BookPageWrapper";
import { Volume2, Pause } from "lucide-react";

/* ── ImagePage ── */
interface ImagePageProps {
    storyId: number;
    sectionType: string;
    imageUrl: string | null;
    videoUrl: string | null;
    pagePosition?: "left" | "right";
}

const ImagePage = React.forwardRef<HTMLDivElement, ImagePageProps>(
    ({ storyId, sectionType, imageUrl, videoUrl, pagePosition = "left" }, ref) => {
        return (
            <div ref={ref} className="w-full h-full">
                <BookPageWrapper pagePosition={pagePosition}>
                    {imageUrl ? (
                        <OnDemandVideoPlayer
                            storyId={storyId}
                            sectionType={sectionType}
                            imageUrl={imageUrl}
                            videoUrl={videoUrl}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
                            <p className="text-slate-400 text-sm">No illustration yet</p>
                        </div>
                    )}
                </BookPageWrapper>
            </div>
        );
    }
);
ImagePage.displayName = "ImagePage";

/* ── TextPage ── */
interface TextPageProps {
    sectionLabel: string;
    textContent: string;
    audioUrl: string | null;
    pagePosition?: "left" | "right";
    pageNumber?: number;
}

const TextPage = React.forwardRef<HTMLDivElement, TextPageProps>(
    ({ sectionLabel, textContent, audioUrl, pagePosition = "right", pageNumber }, ref) => {
        const audioRef = useRef<HTMLAudioElement>(null);
        const [playing, setPlaying] = useState(false);

        const toggleAudio = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!audioRef.current) return;
            if (playing) {
                audioRef.current.pause();
                setPlaying(false);
            } else {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
                setPlaying(true);
            }
        };

        return (
            <div ref={ref} className="w-full h-full">
                <BookPageWrapper pagePosition={pagePosition}>
                    <div className="w-full h-full p-5 flex flex-col justify-between">
                        {/* Section label */}
                        <div className="overflow-y-auto flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400 mb-3">
                                {sectionLabel}
                            </p>
                            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-serif">
                                {textContent}
                            </p>
                        </div>

                        {/* Audio + page number footer */}
                        <div className="flex items-center justify-between mt-3 shrink-0">
                            {audioUrl ? (
                                <>
                                    <audio
                                        ref={audioRef}
                                        src={audioUrl}
                                        preload="none"
                                        onEnded={() => setPlaying(false)}
                                        onPause={() => setPlaying(false)}
                                    />
                                    <button
                                        onClick={toggleAudio}
                                        className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 transition-colors"
                                    >
                                        {playing ? (
                                            <Pause className="w-3.5 h-3.5 text-sky-500" />
                                        ) : (
                                            <Volume2 className="w-3.5 h-3.5 text-sky-500" />
                                        )}
                                        <span className="text-xs text-sky-600 font-medium">
                                            {playing ? "Pause" : "🔊 Listen"}
                                        </span>
                                    </button>
                                </>
                            ) : (
                                <div />
                            )}
                            {pageNumber && (
                                <span className="text-[10px] text-slate-300 font-medium">
                                    {pageNumber}
                                </span>
                            )}
                        </div>
                    </div>
                </BookPageWrapper>
            </div>
        );
    }
);
TextPage.displayName = "TextPage";

export { ImagePage, TextPage };
