"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Loader2, Volume2, Check } from "lucide-react";
import type { SectionData, SectionType } from "@/types";
import { SECTION_ORDER } from "@/types";

interface FinalizationProgressProps {
    storyId: number;
}

export default function FinalizationProgress({
    storyId,
}: FinalizationProgressProps) {
    const router = useRouter();
    const [sections, setSections] = useState<SectionData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [completedCount, setCompletedCount] = useState(0);

    // Fetch sections on mount
    useEffect(() => {
        async function fetchSections() {
            try {
                const res = await fetch(`/api/stories/${storyId}`);
                if (!res.ok) throw new Error("Failed to load story");
                const data = await res.json();
                setSections(data.story.sections);

                // Find first section without audio
                const idx = data.story.sections.findIndex(
                    (s: SectionData) => !s.audioUrl
                );
                if (idx === -1) {
                    // All done — redirect to preview
                    router.push(`/preview/${storyId}`);
                    return;
                }
                setCurrentIndex(idx);
                setCompletedCount(idx);
            } finally {
                setLoading(false);
            }
        }
        fetchSections();
    }, [storyId, router]);

    // Auto-generate audio sequentially
    useEffect(() => {
        if (loading || generating || sections.length === 0) return;
        if (currentIndex >= sections.length) {
            // All done
            router.push(`/preview/${storyId}`);
            return;
        }

        const section = sections[currentIndex];
        if (section.audioUrl) {
            // Already has audio — skip
            setCurrentIndex((prev) => prev + 1);
            setCompletedCount((prev) => prev + 1);
            return;
        }

        async function generateAudio() {
            setGenerating(true);
            setError(null);
            try {
                const res = await fetch(`/api/finalize/${storyId}/audio`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sectionType: section.sectionType,
                    }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to generate audio");
                }
                const data = await res.json();

                setCompletedCount((prev) => prev + 1);
                setCurrentIndex((prev) => prev + 1);

                if (data.allComplete) {
                    setTimeout(() => router.push(`/preview/${storyId}`), 1500);
                }
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setGenerating(false);
            }
        }

        generateAudio();
    }, [currentIndex, loading, generating, sections, storyId, router]);

    const progressPercent = Math.round(
        (completedCount / Math.max(sections.length, 1)) * 100
    );

    const currentSection =
        currentIndex < sections.length ? sections[currentIndex] : null;
    const currentLabel = currentSection
        ? SECTION_ORDER.find((s) => s.type === currentSection.sectionType)
            ?.label ?? currentSection.sectionType
        : "";

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto p-6 text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                {progressPercent >= 100 ? (
                    <Check className="w-8 h-8 text-primary" />
                ) : (
                    <Volume2 className="w-8 h-8 text-primary animate-pulse" />
                )}
            </div>

            <div>
                <h2 className="text-xl font-bold">Generating Audio Narration</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Creating voice narration for each section of your story
                </p>
            </div>

            <Progress value={progressPercent} className="h-3" />

            <p className="text-sm font-medium">
                {progressPercent >= 100 ? (
                    "All narrations complete! Redirecting..."
                ) : (
                    <>
                        Recording narration for:{" "}
                        <span className="text-primary">{currentLabel}</span>
                        <span className="text-muted-foreground">
                            {" "}
                            ({completedCount + 1}/{sections.length})
                        </span>
                    </>
                )}
            </p>

            {generating && (
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            )}

            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Section status list */}
            <div className="space-y-2 text-left">
                {sections.map((section, i) => {
                    const label =
                        SECTION_ORDER.find(
                            (s) => s.type === section.sectionType
                        )?.label ?? section.sectionType;
                    const isDone = i < completedCount || !!section.audioUrl;
                    const isActive = i === currentIndex && generating;

                    return (
                        <div
                            key={section.id}
                            className="flex items-center gap-3 py-1.5 px-3 rounded-md text-sm"
                        >
                            {isDone ? (
                                <Check className="w-4 h-4 text-primary shrink-0" />
                            ) : isActive ? (
                                <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                            ) : (
                                <div className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0" />
                            )}
                            <span
                                className={
                                    isDone
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                }
                            >
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
