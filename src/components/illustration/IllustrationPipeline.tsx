"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIllustration } from "@/hooks/useIllustration";
import BriefEditor from "@/components/illustration/BriefEditor";
import ImagePreview from "@/components/illustration/ImagePreview";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AudioLines, ChevronLeft, ChevronRight } from "lucide-react";
import type { SectionData, SectionType } from "@/types";
import { ILLUSTRATION_ORDER, SECTION_ORDER } from "@/types";

interface IllustrationPipelineProps {
    storyId: number;
}

export default function IllustrationPipeline({
    storyId,
}: IllustrationPipelineProps) {
    const router = useRouter();
    const [sections, setSections] = useState<SectionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStyle, setSelectedStyle] = useState("<3d cartoon>");

    const {
        currentStep,
        currentSectionType,
        brief,
        imageUrl,
        briefLoading,
        imageLoading,
        lockLoading,
        error,
        generateBrief,
        reviseBrief,
        generateImage,
        lockImage,
        setBrief,
        isComplete,
        goToStep,
        goToNextStep,
        goToPrevStep,
        hydrated,
    } = useIllustration(sections);

    useEffect(() => {
        async function fetchSections() {
            try {
                const res = await fetch(`/api/stories/${storyId}`);
                if (!res.ok) throw new Error("Failed to load story");
                const data = await res.json();
                setSections(data.story.sections);
            } finally {
                setLoading(false);
            }
        }
        fetchSections();
    }, [storyId]);

    const progressPercent = Math.round(
        (currentStep / ILLUSTRATION_ORDER.length) * 100
    );

    if (loading || !hydrated) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="max-w-2xl mx-auto p-6 text-center space-y-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">All Illustrations Complete!</h2>
                <p className="text-sm text-muted-foreground">
                    All sections have been illustrated. Ready for audio narration.
                </p>
                <Button
                    size="lg"
                    onClick={() => router.push(`/finalize/${storyId}`)}
                    className="gap-2"
                >
                    <AudioLines className="w-4 h-4" />
                    Generate Audio Narration
                </Button>
            </div>
        );
    }

    const currentMeta = SECTION_ORDER.find(
        (s) => s.type === currentSectionType
    );
    const currentSection = sections.find(
        (s) => s.sectionType === currentSectionType
    );

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-xl font-bold">Illustrate Your Story</h2>
                <p className="text-sm text-muted-foreground">
                    Create illustrations for each section of your narrative
                </p>
            </div>

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    {ILLUSTRATION_ORDER.map((type, i) => {
                        const label =
                            SECTION_ORDER.find((s) => s.type === type)?.label ??
                            type;
                        const section = sections.find(
                            (s) => s.sectionType === type
                        );
                        const isDone = section?.isIllustrated;
                        const isActive = i === currentStep;

                        return (
                            <Badge
                                key={type}
                                variant={
                                    isDone
                                        ? "default"
                                        : isActive
                                            ? "secondary"
                                            : "outline"
                                }
                                className="text-[10px] flex-1 justify-center cursor-pointer"
                                onClick={() => goToStep(i)}
                            >
                                {isDone ? "✓ " : ""}
                                {label}
                            </Badge>
                        );
                    })}
                </div>
                <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Current section info */}
            <div className="rounded-lg border border-border p-4 bg-card">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">
                        {currentMeta?.label ?? currentSectionType}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                        Step {currentStep + 1} of {ILLUSTRATION_ORDER.length}
                    </Badge>
                </div>

                {/* Show section text for reference */}
                <div className="mb-4 p-3 bg-muted/50 rounded-md">
                    <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                        Section Text
                    </p>
                    <p className="text-sm leading-relaxed">
                        {currentSection?.textContent || "(No text)"}
                    </p>
                </div>

                {/* Brief editor */}
                <BriefEditor
                    brief={brief}
                    onBriefChange={setBrief}
                    onGenerateBrief={() => generateBrief(storyId)}
                    onReviseBrief={(revision) => reviseBrief(storyId, revision)}
                    onGenerateImage={(style) => generateImage(storyId, style)}
                    briefLoading={briefLoading}
                    imageLoading={imageLoading}
                    hasImage={!!imageUrl}
                    selectedStyle={selectedStyle}
                    onStyleChange={setSelectedStyle}
                />

                {/* Image preview + lock */}
                {imageUrl && (
                    <div className="mt-4">
                        <ImagePreview
                            imageUrl={imageUrl}
                            onRegenerate={() => generateImage(storyId, selectedStyle)}
                            onLockAndProceed={() => lockImage(storyId)}
                            imageLoading={imageLoading}
                            lockLoading={lockLoading}
                        />
                    </div>
                )}

                {error && (
                    <div className="mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive">{error}</p>
                        {error.includes("muat ulang") && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => window.location.reload()}
                            >
                                Muat Ulang Halaman
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={goToPrevStep}
                    disabled={currentStep === 0}
                    className="gap-2"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </Button>

                {currentStep === ILLUSTRATION_ORDER.length - 1 ? (
                    <Button
                        onClick={() => router.push(`/finalize/${storyId}`)}
                        className="gap-2"
                    >
                        <AudioLines className="w-4 h-4" />
                        Finish & Continue
                    </Button>
                ) : (
                    <Button
                        onClick={goToNextStep}
                        disabled={currentStep >= ILLUSTRATION_ORDER.length - 1}
                        className="gap-2"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
