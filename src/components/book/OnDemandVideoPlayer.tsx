"use client";

import { useState, useCallback, useRef } from "react";
import { Loader2, Sparkles, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnDemandVideoPlayerProps {
    storyId: number;
    sectionType: string;
    imageUrl: string;
    videoUrl: string | null;
}

export default function OnDemandVideoPlayer({
    storyId,
    sectionType,
    imageUrl,
    videoUrl: initialVideoUrl,
}: OnDemandVideoPlayerProps) {
    const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl);
    const [generating, setGenerating] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleGenerate = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent page flip
        setGenerating(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/video/${storyId}/${sectionType}/generate`,
                { method: "POST" }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to generate video");
            }
            const data = await res.json();
            setVideoUrl(data.videoUrl);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setGenerating(false);
        }
    }, [storyId, sectionType]);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent page flip
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleVideoEnded = () => {
        setIsPlaying(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };

    // State 3: Video exists — layered image + video with crossfade
    if (videoUrl) {
        return (
            <div className="relative w-full h-full bg-black overflow-hidden group">
                {/* Video layer (always mounted, behind the image) */}
                <video
                    ref={videoRef}
                    src={videoUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    onEnded={handleVideoEnded}
                />

                {/* Image layer — crossfades over the video */}
                <img
                    src={imageUrl}
                    alt="Illustration"
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${isPlaying ? "opacity-0" : "opacity-100"
                        }`}
                />

                {/* Play/Pause hover overlay */}
                <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                    {isPlaying ? (
                        <Pause className="w-12 h-12 text-white drop-shadow-lg" />
                    ) : (
                        <Play className="w-12 h-12 text-white drop-shadow-lg" />
                    )}
                </button>
            </div>
        );
    }

    // State 2: Generating
    if (generating) {
        return (
            <div className="relative w-full h-full overflow-hidden">
                <img
                    src={imageUrl}
                    alt="Illustration"
                    className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white">
                    <Loader2 className="w-10 h-10 animate-spin mb-3" />
                    <p className="text-sm font-medium animate-pulse">
                        Processing Video...
                    </p>
                    <p className="text-xs text-white/60 mt-1">
                        This may take 2–3 minutes. Please don&apos;t close this page.
                    </p>
                </div>
            </div>
        );
    }

    // State 1: Static image + generate button
    return (
        <div className="relative w-full h-full overflow-hidden group">
            <img
                src={imageUrl}
                alt="Illustration"
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                <Button
                    onClick={handleGenerate}
                    variant="secondary"
                    className="opacity-0 group-hover:opacity-100 transition-opacity gap-2 rounded-xl shadow-xl bg-white/90 text-slate-800 hover:bg-white"
                >
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    Animate this page (AI Video)
                </Button>
            </div>

            {error && (
                <div className="absolute bottom-2 left-2 right-2 bg-red-500/90 text-white text-xs p-2 rounded-lg">
                    {error}
                </div>
            )}
        </div>
    );
}
