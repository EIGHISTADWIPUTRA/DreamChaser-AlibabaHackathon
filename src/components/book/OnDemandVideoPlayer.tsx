"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Loader2, Sparkles, Play, Pause, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type JobStatus = "idle" | "processing" | "completed" | "failed";

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
    const [status, setStatus] = useState<JobStatus>(initialVideoUrl ? "completed" : "idle");
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    // Clean up interval on unmount
    useEffect(() => () => stopPolling(), [stopPolling]);

    const checkStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/video/${storyId}/${sectionType}/status`);
            if (!res.ok) return; // transient error — keep polling
            const data: { status: JobStatus; videoUrl?: string; error?: string } =
                await res.json();

            if (data.status === "completed" && data.videoUrl) {
                setVideoUrl(data.videoUrl);
                setStatus("completed");
                stopPolling();
            } else if (data.status === "failed") {
                setError(data.error ?? "Video generation failed. Please try again.");
                setStatus("failed");
                stopPolling();
            }
            // "processing" / "idle" → keep polling
        } catch {
            // ignore transient network errors; keep polling
        }
    }, [storyId, sectionType, stopPolling]);

    const startPolling = useCallback(() => {
        stopPolling();
        pollingRef.current = setInterval(checkStatus, 7000);
    }, [checkStatus, stopPolling]);

    // On mount, resume polling if a job was already in progress (e.g. after page refresh)
    useEffect(() => {
        if (initialVideoUrl) return;
        fetch(`/api/video/${storyId}/${sectionType}/status`)
            .then((r) => r.json())
            .then((data: { status: JobStatus; videoUrl?: string }) => {
                if (data.status === "processing") {
                    setStatus("processing");
                    startPolling();
                } else if (data.status === "completed" && data.videoUrl) {
                    setVideoUrl(data.videoUrl);
                    setStatus("completed");
                }
            })
            .catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleGenerate = useCallback(
        async (e: React.MouseEvent) => {
            e.stopPropagation();
            setError(null);
            setStatus("processing");
            try {
                const res = await fetch(
                    `/api/video/${storyId}/${sectionType}/generate`,
                    { method: "POST" }
                );
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error ?? "Failed to start video generation");
                }
                const data: { status: JobStatus; videoUrl?: string } = await res.json();
                if (data.status === "completed" && data.videoUrl) {
                    // Rare: was already generated
                    setVideoUrl(data.videoUrl);
                    setStatus("completed");
                    return;
                }
                // Start polling for progress
                startPolling();
            } catch (err) {
                setError((err as Error).message);
                setStatus("failed");
            }
        },
        [storyId, sectionType, startPolling]
    );

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
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

    // ── State: completed — layered image + video with crossfade ──────────────
    if (status === "completed" && videoUrl) {
        return (
            <div className="relative w-full h-full bg-black overflow-hidden group">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    onEnded={handleVideoEnded}
                />
                <img
                    src={imageUrl}
                    alt="Illustration"
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                        isPlaying ? "opacity-0" : "opacity-100"
                    }`}
                />
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

    // ── State: processing ─────────────────────────────────────────────────────
    if (status === "processing") {
        return (
            <div className="relative w-full h-full overflow-hidden">
                <img
                    src={imageUrl}
                    alt="Illustration"
                    className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white">
                    <Loader2 className="w-10 h-10 animate-spin mb-3" />
                    <p className="text-sm font-medium animate-pulse">Generating Video…</p>
                    <p className="text-xs text-white/60 mt-1">
                        This can take 2–4 minutes. You can safely navigate away and come back.
                    </p>
                </div>
            </div>
        );
    }

    // ── State: idle / failed — static image + generate button ─────────────────
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
                    {status === "failed" ? "Retry AI Video" : "Animate this page (AI Video)"}
                </Button>
            </div>

            {status === "failed" && error && (
                <div className="absolute bottom-2 left-2 right-2 flex items-start gap-2 bg-red-600/90 text-white text-xs p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}

