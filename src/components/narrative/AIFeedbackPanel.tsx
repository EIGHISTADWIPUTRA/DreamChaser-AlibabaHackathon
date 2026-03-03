"use client";

import type { AIFeedback } from "@/types";
import { cn } from "@/lib/utils";
import { X, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIFeedbackPanelProps {
    feedback: AIFeedback;
    onClose: () => void;
}

export default function AIFeedbackPanel({
    feedback,
    onClose,
}: AIFeedbackPanelProps) {
    return (
        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-primary">
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-semibold">AI Feedback</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={onClose}
                >
                    <X className="w-3.5 h-3.5" />
                </Button>
            </div>

            <p className="text-sm leading-relaxed text-foreground/90">
                {feedback.feedback}
            </p>

            {feedback.suggestions && feedback.suggestions.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Suggestions
                    </p>
                    <ul className="space-y-1.5">
                        {feedback.suggestions.map((suggestion, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-foreground/80"
                            >
                                <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                                <span>{suggestion}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
