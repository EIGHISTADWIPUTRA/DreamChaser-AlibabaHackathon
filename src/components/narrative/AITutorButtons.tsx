"use client";

import { cn } from "@/lib/utils";
import type { AIFeedback, SectionType } from "@/types";
import { Loader2, CheckCircle, Lightbulb, BookCheck, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AITutorButtonsProps {
    sectionType: SectionType;
    currentText: string;
    canUseStructure: boolean;
    canUseBrainstorm: boolean;
    aiLoading: string | null;
    onStructure: () => void;
    onGrammar: () => void;
    onBrainstorm: () => void;
}

export default function AITutorButtons({
    sectionType,
    currentText,
    canUseStructure,
    canUseBrainstorm,
    aiLoading,
    onStructure,
    onGrammar,
    onBrainstorm,
}: AITutorButtonsProps) {
    const hasText = currentText?.trim().length > 0;

    // Title section doesn't need structure or grammar buttons — only brainstorm
    const isTitle = sectionType === "title";

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {!isTitle && (
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!hasText || !canUseStructure || aiLoading !== null}
                        onClick={onStructure}
                        className="gap-1.5 text-xs"
                    >
                        {aiLoading === "structure" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <BookCheck className="w-3.5 h-3.5" />
                        )}
                        Structure
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!hasText || aiLoading !== null}
                        onClick={onGrammar}
                        className="gap-1.5 text-xs"
                    >
                        {aiLoading === "grammar" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <PenLine className="w-3.5 h-3.5" />
                        )}
                        Grammar
                    </Button>
                </>
            )}
            <Button
                variant="outline"
                size="sm"
                disabled={!canUseBrainstorm || aiLoading !== null}
                onClick={onBrainstorm}
                className="gap-1.5 text-xs"
            >
                {aiLoading === "brainstorm" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <Lightbulb className="w-3.5 h-3.5" />
                )}
                Brainstorm
            </Button>
        </div>
    );
}
