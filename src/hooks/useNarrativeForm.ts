"use client";

import { useState, useCallback } from "react";
import type { SectionData, SectionType, AIFeedback } from "@/types";
import { SECTION_ORDER } from "@/types";

interface UseNarrativeFormReturn {
    sections: SectionData[];
    loading: boolean;
    error: string | null;
    fetchSections: (storyId: number) => Promise<void>;
    updateSection: (
        storyId: number,
        sectionType: SectionType,
        data: { textContent?: string; isLocked?: boolean }
    ) => Promise<void>;
    canEdit: (sectionType: SectionType) => boolean;
    canUseStructure: (sectionType: SectionType) => boolean;
    canUseBrainstorm: (sectionType: SectionType) => boolean;
    allSectionsLocked: boolean;
    aiFeedback: AIFeedback | null;
    aiLoading: string | null; // which button is loading
    requestStructureCheck: (
        storyId: number,
        sectionType: SectionType,
        currentText: string
    ) => Promise<void>;
    requestGrammarCheck: (text: string) => Promise<void>;
    requestBrainstorm: (
        storyId: number,
        sectionType: SectionType
    ) => Promise<void>;
    clearFeedback: () => void;
}

export function useNarrativeForm(): UseNarrativeFormReturn {
    const [sections, setSections] = useState<SectionData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
    const [aiLoading, setAiLoading] = useState<string | null>(null);

    const allSectionsLocked = sections.length > 0 && sections.every((s) => s.isLocked);

    const fetchSections = useCallback(async (storyId: number) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/stories/${storyId}`);
            if (!res.ok) throw new Error("Failed to load story");
            const data = await res.json();
            setSections(data.story.sections);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateSection = useCallback(
        async (
            storyId: number,
            sectionType: SectionType,
            data: { textContent?: string; isLocked?: boolean }
        ) => {
            try {
                const res = await fetch(
                    `/api/stories/${storyId}/sections/${sectionType}`,
                    {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data),
                    }
                );
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || "Failed to update section");
                }
                const result = await res.json();
                setSections(result.allSections);
            } catch (err) {
                setError((err as Error).message);
                throw err;
            }
        },
        []
    );

    const canEdit = useCallback(
        (sectionType: SectionType): boolean => {
            const sectionMeta = SECTION_ORDER.find((s) => s.type === sectionType);
            if (!sectionMeta) return false;

            const section = sections.find((s) => s.sectionType === sectionType);
            if (!section) return false;

            // Can't edit if locked
            if (section.isLocked) return false;

            // First section is always editable
            if (sectionMeta.sortOrder === 1) return true;

            // Can edit if all previous sections are locked
            const previousSections = sections.filter(
                (s) => s.sortOrder < sectionMeta.sortOrder
            );
            return previousSections.every((s) => s.isLocked);
        },
        [sections]
    );

    const canUseStructure = useCallback(
        (sectionType: SectionType): boolean => {
            const sectionMeta = SECTION_ORDER.find((s) => s.type === sectionType);
            if (!sectionMeta) return false;

            // Structure check requires all previous sections to be locked
            const previousSections = sections.filter(
                (s) => s.sortOrder < sectionMeta.sortOrder
            );
            return previousSections.every((s) => s.isLocked);
        },
        [sections]
    );

    const canUseBrainstorm = useCallback(
        (sectionType: SectionType): boolean => {
            // Same rule as structure — needs context from locked previous sections
            return canUseStructure(sectionType);
        },
        [canUseStructure]
    );

    const getLockedPreviousSections = useCallback(
        (sectionType: SectionType) => {
            const sectionMeta = SECTION_ORDER.find((s) => s.type === sectionType);
            if (!sectionMeta) return [];

            return sections
                .filter(
                    (s) =>
                        s.sortOrder < sectionMeta.sortOrder && s.isLocked
                )
                .map((s) => ({
                    type: s.sectionType as SectionType,
                    text: s.textContent,
                }));
        },
        [sections]
    );

    const requestStructureCheck = useCallback(
        async (_storyId: number, sectionType: SectionType, currentText: string) => {
            if (!currentText?.trim()) return;

            setAiLoading("structure");
            setAiFeedback(null);
            try {
                const res = await fetch("/api/ai/structure", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sectionType,
                        currentText,
                        previousSections: getLockedPreviousSections(sectionType),
                    }),
                });
                if (!res.ok) throw new Error("Structure check failed");
                const result = await res.json();
                setAiFeedback(result);
            } catch (err) {
                setAiFeedback({
                    feedback: "Failed to check structure: " + (err as Error).message,
                });
            } finally {
                setAiLoading(null);
            }
        },
        [getLockedPreviousSections]
    );

    const requestGrammarCheck = useCallback(async (text: string) => {
        if (!text?.trim()) return;

        setAiLoading("grammar");
        setAiFeedback(null);
        try {
            const res = await fetch("/api/ai/grammar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw new Error("Grammar check failed");
            const result = await res.json();
            setAiFeedback(result);
        } catch (err) {
            setAiFeedback({
                feedback: "Failed to check grammar: " + (err as Error).message,
            });
        } finally {
            setAiLoading(null);
        }
    }, []);

    const requestBrainstorm = useCallback(
        async (_storyId: number, sectionType: SectionType) => {
            setAiLoading("brainstorm");
            setAiFeedback(null);
            try {
                const res = await fetch("/api/ai/brainstorm", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sectionType,
                        previousSections: getLockedPreviousSections(sectionType),
                    }),
                });
                if (!res.ok) throw new Error("Brainstorm failed");
                const result = await res.json();
                setAiFeedback(result);
            } catch (err) {
                setAiFeedback({
                    feedback: "Failed to brainstorm: " + (err as Error).message,
                });
            } finally {
                setAiLoading(null);
            }
        },
        [getLockedPreviousSections]
    );

    const clearFeedback = useCallback(() => {
        setAiFeedback(null);
    }, []);

    return {
        sections,
        loading,
        error,
        fetchSections,
        updateSection,
        canEdit,
        canUseStructure,
        canUseBrainstorm,
        allSectionsLocked,
        aiFeedback,
        aiLoading,
        requestStructureCheck,
        requestGrammarCheck,
        requestBrainstorm,
        clearFeedback,
    };
}
