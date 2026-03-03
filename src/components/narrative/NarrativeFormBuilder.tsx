"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useNarrativeForm } from "@/hooks/useNarrativeForm";
import SectionCard from "@/components/narrative/SectionCard";
import { Button } from "@/components/ui/button";
import { Loader2, Palette } from "lucide-react";
import type { SectionType } from "@/types";

interface NarrativeFormBuilderProps {
    storyId: number;
}

export default function NarrativeFormBuilder({
    storyId,
}: NarrativeFormBuilderProps) {
    const router = useRouter();
    const {
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
    } = useNarrativeForm();

    const [localTexts, setLocalTexts] = useState<Record<string, string>>({});
    const [activeFeedbackSection, setActiveFeedbackSection] =
        useState<SectionType | null>(null);
    const [saving, setSaving] = useState(false);
    const [transitioning, setTransitioning] = useState(false);

    // Fetch sections on mount
    useEffect(() => {
        fetchSections(storyId);
    }, [storyId, fetchSections]);

    // Sync local texts when sections change
    useEffect(() => {
        const texts: Record<string, string> = {};
        for (const s of sections) {
            texts[s.sectionType] = s.textContent;
        }
        setLocalTexts(texts);
    }, [sections]);

    // Auto-save text on blur or before lock
    const saveText = useCallback(
        async (sectionType: SectionType) => {
            const text = localTexts[sectionType];
            const section = sections.find((s) => s.sectionType === sectionType);
            if (section && text !== section.textContent) {
                setSaving(true);
                try {
                    await updateSection(storyId, sectionType, {
                        textContent: text,
                    });
                } finally {
                    setSaving(false);
                }
            }
        },
        [localTexts, sections, storyId, updateSection]
    );

    const handleLock = useCallback(
        async (sectionType: SectionType) => {
            // Save text first
            await saveText(sectionType);
            // Then lock
            await updateSection(storyId, sectionType, {
                textContent: localTexts[sectionType],
                isLocked: true,
            });
            clearFeedback();
            setActiveFeedbackSection(null);
        },
        [saveText, updateSection, storyId, localTexts, clearFeedback]
    );

    const handleUnlock = useCallback(
        async (sectionType: SectionType) => {
            await updateSection(storyId, sectionType, { isLocked: false });
            clearFeedback();
            setActiveFeedbackSection(null);
        },
        [updateSection, storyId, clearFeedback]
    );

    const handleProceedToIllustrate = async () => {
        setTransitioning(true);
        try {
            // Update story status to illustrating
            await fetch(`/api/stories/${storyId}/sections/title`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            router.push(`/illustrate/${storyId}`);
        } catch {
            setTransitioning(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-destructive">{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-4">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold">Write Your Narrative</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Fill each section in order. Use the AI tutor buttons for guidance.
                </p>
            </div>

            {sections.map((section) => (
                <SectionCard
                    key={section.id}
                    section={{
                        ...section,
                        textContent:
                            localTexts[section.sectionType] ?? section.textContent,
                    }}
                    storyId={storyId}
                    canEdit={canEdit(section.sectionType as SectionType)}
                    canUseStructure={canUseStructure(
                        section.sectionType as SectionType
                    )}
                    canUseBrainstorm={canUseBrainstorm(
                        section.sectionType as SectionType
                    )}
                    aiFeedback={aiFeedback}
                    aiLoading={aiLoading}
                    activeFeedbackSection={activeFeedbackSection}
                    onTextChange={(text) => {
                        setLocalTexts((prev) => ({
                            ...prev,
                            [section.sectionType]: text,
                        }));
                    }}
                    onLock={() =>
                        handleLock(section.sectionType as SectionType)
                    }
                    onUnlock={() =>
                        handleUnlock(section.sectionType as SectionType)
                    }
                    onStructure={() => {
                        setActiveFeedbackSection(
                            section.sectionType as SectionType
                        );
                        requestStructureCheck(
                            storyId,
                            section.sectionType as SectionType,
                            localTexts[section.sectionType] ??
                            section.textContent
                        );
                    }}
                    onGrammar={() => {
                        setActiveFeedbackSection(
                            section.sectionType as SectionType
                        );
                        requestGrammarCheck(
                            localTexts[section.sectionType] ??
                            section.textContent
                        );
                    }}
                    onBrainstorm={() => {
                        setActiveFeedbackSection(
                            section.sectionType as SectionType
                        );
                        requestBrainstorm(
                            storyId,
                            section.sectionType as SectionType
                        );
                    }}
                    onClearFeedback={() => {
                        clearFeedback();
                        setActiveFeedbackSection(null);
                    }}
                />
            ))}

            {allSectionsLocked && (
                <div className="flex justify-center pt-4">
                    <Button
                        size="lg"
                        onClick={handleProceedToIllustrate}
                        disabled={transitioning}
                        className="gap-2"
                    >
                        {transitioning ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Palette className="w-4 h-4" />
                        )}
                        Proceed to Illustration
                    </Button>
                </div>
            )}

            {saving && (
                <div className="fixed bottom-4 right-4 bg-muted rounded-lg px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                    Saving...
                </div>
            )}
        </div>
    );
}
