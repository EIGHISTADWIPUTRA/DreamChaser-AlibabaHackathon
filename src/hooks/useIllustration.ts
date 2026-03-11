"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { SectionData, SectionType } from "@/types";
import { ILLUSTRATION_ORDER } from "@/types";

const RELOAD_MESSAGE =
    "Sistem baru saja diperbarui. Silakan muat ulang (refresh) halaman ini untuk melanjutkan.";

function isDeployMismatchError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    return (
        msg.includes("Failed to find Server Action") ||
        msg.includes("older or newer deployment")
    );
}

function isServerError(status: number): boolean {
    return status === 500 || status === 502 || status === 504;
}

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
    goToNextStep: () => void;
    goToPrevStep: () => void;
    hydrated: boolean;
}

function hydrateStep(step: number, sections: SectionData[]) {
    if (step >= ILLUSTRATION_ORDER.length) return { brief: "", imageUrl: null };
    const type = ILLUSTRATION_ORDER[step];
    const section = sections.find((s) => s.sectionType === type);
    return {
        brief: section?.imagePromptBrief ?? "",
        imageUrl: section?.imageUrl ?? null,
    };
}

function findInitialStep(sections: SectionData[]): number {
    for (let i = 0; i < ILLUSTRATION_ORDER.length; i++) {
        const type = ILLUSTRATION_ORDER[i];
        const section = sections.find((s) => s.sectionType === type);
        if (!section?.isIllustrated) return i;
    }
    return ILLUSTRATION_ORDER.length; // all done
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
    const [hydrated, setHydrated] = useState(false);
    const didHydrate = useRef(false);

    // Hydrate state from sections on first load
    useEffect(() => {
        if (didHydrate.current || sections.length === 0) return;
        didHydrate.current = true;
        const step = findInitialStep(sections);
        setCurrentStep(step);
        const data = hydrateStep(step, sections);
        setBrief(data.brief);
        setImageUrl(data.imageUrl);
        setHydrated(true);
    }, [sections]);

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
                if (!res.ok) {
                    if (isServerError(res.status)) {
                        const body = await res.json().catch(() => ({}));
                        throw new Error(body.error || "Server error");
                    }
                    throw new Error("Failed to generate brief");
                }
                const data = await res.json();
                setBrief(data.brief);
            } catch (err) {
                if (isDeployMismatchError(err)) {
                    setError(RELOAD_MESSAGE);
                } else {
                    setError((err as Error).message);
                }
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
                if (!res.ok) {
                    if (isServerError(res.status)) {
                        const body = await res.json().catch(() => ({}));
                        throw new Error(body.error || "Server error");
                    }
                    throw new Error("Failed to revise brief");
                }
                const data = await res.json();
                setBrief(data.brief);
            } catch (err) {
                if (isDeployMismatchError(err)) {
                    setError(RELOAD_MESSAGE);
                } else {
                    setError((err as Error).message);
                }
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
                if (isDeployMismatchError(err)) {
                    setError(RELOAD_MESSAGE);
                } else {
                    setError((err as Error).message);
                }
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

    const goToStep = useCallback(
        (step: number) => {
            if (step < 0 || step > ILLUSTRATION_ORDER.length) return;
            setCurrentStep(step);
            setError(null);
            const data = hydrateStep(step, sections);
            setBrief(data.brief);
            setImageUrl(data.imageUrl);
        },
        [sections]
    );

    const goToNextStep = useCallback(() => {
        goToStep(currentStep + 1);
    }, [currentStep, goToStep]);

    const goToPrevStep = useCallback(() => {
        goToStep(currentStep - 1);
    }, [currentStep, goToStep]);

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
        goToNextStep,
        goToPrevStep,
        hydrated,
    };
}
