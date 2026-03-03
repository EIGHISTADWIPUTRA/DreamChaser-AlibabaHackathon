"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SectionData, SectionType, AIFeedback } from "@/types";
import { SECTION_ORDER } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AITutorButtons from "@/components/narrative/AITutorButtons";
import AIFeedbackPanel from "@/components/narrative/AIFeedbackPanel";
import {
    Lock,
    Unlock,
    ChevronDown,
    ChevronUp,
    Check,
    Loader2,
} from "lucide-react";

interface SectionCardProps {
    section: SectionData;
    storyId: number;
    canEdit: boolean;
    canUseStructure: boolean;
    canUseBrainstorm: boolean;
    aiFeedback: AIFeedback | null;
    aiLoading: string | null;
    activeFeedbackSection: SectionType | null;
    onTextChange: (text: string) => void;
    onLock: () => void;
    onUnlock: () => void;
    onStructure: () => void;
    onGrammar: () => void;
    onBrainstorm: () => void;
    onClearFeedback: () => void;
}

export default function SectionCard({
    section,
    storyId,
    canEdit,
    canUseStructure,
    canUseBrainstorm,
    aiFeedback,
    aiLoading,
    activeFeedbackSection,
    onTextChange,
    onLock,
    onUnlock,
    onStructure,
    onGrammar,
    onBrainstorm,
    onClearFeedback,
}: SectionCardProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [lockLoading, setLockLoading] = useState(false);

    const meta = SECTION_ORDER.find((s) => s.type === section.sectionType);
    const isTitle = section.sectionType === "title";
    const showFeedback =
        aiFeedback && activeFeedbackSection === section.sectionType;

    const handleLock = async () => {
        setLockLoading(true);
        try {
            await onLock();
        } finally {
            setLockLoading(false);
        }
    };

    const handleUnlock = async () => {
        setLockLoading(true);
        try {
            await onUnlock();
        } finally {
            setLockLoading(false);
        }
    };

    return (
        <div
            className={cn(
                "rounded-xl border transition-all duration-200",
                section.isLocked
                    ? "border-primary/30 bg-primary/5"
                    : canEdit
                        ? "border-border bg-card shadow-sm"
                        : "border-border/50 bg-muted/30 opacity-60"
            )}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() => setCollapsed(!collapsed)}
            >
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                            section.isLocked
                                ? "bg-primary text-primary-foreground"
                                : canEdit
                                    ? "bg-primary/20 text-primary border-2 border-primary"
                                    : "bg-muted text-muted-foreground"
                        )}
                    >
                        {section.isLocked ? (
                            <Check className="w-4 h-4" />
                        ) : (
                            meta?.sortOrder
                        )}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">{meta?.label}</h3>
                        <p className="text-xs text-muted-foreground">
                            {meta?.description}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {section.isLocked && (
                        <Badge variant="default" className="text-[10px] px-2 py-0">
                            Locked
                        </Badge>
                    )}
                    {collapsed ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    )}
                </div>
            </div>

            {/* Body */}
            {!collapsed && (
                <div className="px-4 pb-4 space-y-3">
                    {/* Text Area */}
                    {isTitle ? (
                        <input
                            type="text"
                            value={section.textContent}
                            onChange={(e) => onTextChange(e.target.value)}
                            disabled={!canEdit}
                            placeholder="Enter your story title..."
                            className={cn(
                                "w-full px-3 py-2 rounded-lg border text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors",
                                !canEdit
                                    ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                                    : "bg-background"
                            )}
                        />
                    ) : (
                        <Textarea
                            value={section.textContent}
                            onChange={(e) => onTextChange(e.target.value)}
                            disabled={!canEdit}
                            placeholder={`Write your ${meta?.label.toLowerCase()} here...`}
                            className={cn(
                                "min-h-[120px] resize-y transition-colors",
                                !canEdit && "cursor-not-allowed opacity-70"
                            )}
                            rows={5}
                        />
                    )}

                    {/* AI Tutor Buttons */}
                    {canEdit && !section.isLocked && (
                        <AITutorButtons
                            sectionType={section.sectionType as SectionType}
                            currentText={section.textContent}
                            canUseStructure={canUseStructure}
                            canUseBrainstorm={canUseBrainstorm}
                            aiLoading={activeFeedbackSection === section.sectionType ? aiLoading : null}
                            onStructure={onStructure}
                            onGrammar={onGrammar}
                            onBrainstorm={onBrainstorm}
                        />
                    )}

                    {/* AI Feedback */}
                    {showFeedback && (
                        <AIFeedbackPanel
                            feedback={aiFeedback}
                            onClose={onClearFeedback}
                        />
                    )}

                    {/* Lock/Unlock Buttons */}
                    <div className="flex justify-end gap-2 pt-1">
                        {section.isLocked ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleUnlock}
                                disabled={lockLoading}
                                className="gap-1.5"
                            >
                                {lockLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Unlock className="w-3.5 h-3.5" />
                                )}
                                Unlock
                            </Button>
                        ) : (
                            canEdit && (
                                <Button
                                    size="sm"
                                    onClick={handleLock}
                                    disabled={
                                        lockLoading ||
                                        !section.textContent?.trim()
                                    }
                                    className="gap-1.5"
                                >
                                    {lockLoading ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Lock className="w-3.5 h-3.5" />
                                    )}
                                    Lock & Continue
                                </Button>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
