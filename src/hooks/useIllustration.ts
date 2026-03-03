"use client";

import { useState, useCallback } from "react";
import type { SectionData, SectionType } from "@/types";
import { ILLUSTRATION_ORDER } from "@/types";

interface UseIllustrationReturn {
    currentStep: number;
    currentSectionType: SectionType;
    brief: string;
    imageUrl: string | null;
    briefLoading: boolean;
    imageLoading: boolean;
    lockLoading: boolean;
    error: string | null;
    generateBrief: (storyId: number) => Promise<void>;
    reviseBrief: (storyId: number, revision: string) => Promise<void>;
    generateImage: (storyId: number, style?: string) => Promise<void>;
    lockImage: (storyId: number) => Promise<void>;
    setBrief: (brief: string) => void;
    isComplete: boolean;
    goToStep: (step: number) => void;
}

export function useIllustration(
    sections: SectionData[]
): UseIllustrationReturn {
    const [currentStep, setCurrentStep] = useState(0);
    const [brief, setBrief] = useState("");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [briefLoading, setBriefLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [lockLoading, setLockLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentSectionType = ILLUSTRATION_ORDER[currentStep];
    const isComplete = currentStep >= ILLUSTRATION_ORDER.length;

    const generateBrief = useCallback(
        async (storyId: number) => {
            setBriefLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `/api/illustration/${storyId}/${currentSectionType}/brief`,
                    { method: "POST" }
                );
                if (!res.ok) throw new Error("Failed to generate brief");
                const data = await res.json();
                setBrief(data.brief);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setBriefLoading(false);
            }
        },
        [currentSectionType]
    );

    const reviseBrief = useCallback(
        async (storyId: number, revision: string) => {
            setBriefLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `/api/illustration/${storyId}/${currentSectionType}/revise`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            currentBrief: brief,
                            revision,
                        }),
                    }
                );
                if (!res.ok) throw new Error("Failed to revise brief");
                const data = await res.json();
                setBrief(data.brief);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setBriefLoading(false);
            }
        },
        [currentSectionType, brief]
    );

    const generateImage = useCallback(
        async (storyId: number, style?: string) => {
            setImageLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `/api/illustration/${storyId}/${currentSectionType}/generate`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ style: style ?? "<auto>" }),
                    }
                );
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to generate image");
                }
                const data = await res.json();
                setImageUrl(data.imageUrl);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setImageLoading(false);
            }
        },
        [currentSectionType]
    );

    // Lock image only — no video generation
    const lockImage = useCallback(
        async (storyId: number) => {
            setLockLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `/api/illustration/${storyId}/${currentSectionType}/animate`,
                    { method: "POST" }
                );
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to lock image");
                }

                // Move to next step
                const nextStep = currentStep + 1;
                setCurrentStep(nextStep);
                setBrief("");
                setImageUrl(null);

                // Load brief/image for next section if it exists
                if (nextStep < ILLUSTRATION_ORDER.length) {
                    const nextType = ILLUSTRATION_ORDER[nextStep];
                    const nextSection = sections.find(
                        (s) => s.sectionType === nextType
                    );
                    if (nextSection?.imagePromptBrief) {
                        setBrief(nextSection.imagePromptBrief);
                    }
                    if (nextSection?.imageUrl) {
                        setImageUrl(nextSection.imageUrl);
                    }
                }
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLockLoading(false);
            }
        },
        [currentSectionType, currentStep, sections]
    );

    const goToStep = useCallback((step: number) => {
        setCurrentStep(step);
        setBrief("");
        setImageUrl(null);
        setError(null);
    }, []);

    return {
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
    };
}
