"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Wand2, RefreshCw, Send } from "lucide-react";

const ART_STYLES = [
    { value: "<3d cartoon>", label: "🧸 3D Cartoon" },
    { value: "<photorealism>", label: "📷 Photorealism" },
] as const;

interface BriefEditorProps {
    brief: string;
    onBriefChange: (brief: string) => void;
    onGenerateBrief: () => void;
    onReviseBrief: (revision: string) => void;
    onGenerateImage: (style: string) => void;
    briefLoading: boolean;
    imageLoading: boolean;
    hasImage: boolean;
    selectedStyle: string;
    onStyleChange: (style: string) => void;
}

export default function BriefEditor({
    brief,
    onBriefChange,
    onGenerateBrief,
    onReviseBrief,
    onGenerateImage,
    briefLoading,
    imageLoading,
    hasImage,
    selectedStyle,
    onStyleChange,
}: BriefEditorProps) {
    const [revision, setRevision] = useState("");

    const handleRevise = () => {
        if (revision.trim()) {
            onReviseBrief(revision.trim());
            setRevision("");
        }
    };

    return (
        <div className="space-y-4">
            {!brief ? (
                <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-4">
                        Generate an illustration brief for this section
                    </p>
                    <Button
                        onClick={onGenerateBrief}
                        disabled={briefLoading}
                        className="gap-2"
                    >
                        {briefLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Wand2 className="w-4 h-4" />
                        )}
                        Generate Brief
                    </Button>
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Image Prompt Brief
                        </label>
                        <Textarea
                            value={brief}
                            onChange={(e) => onBriefChange(e.target.value)}
                            className="min-h-[100px] resize-y text-sm"
                            placeholder="Image prompt brief..."
                        />
                    </div>

                    {/* Revision chat */}
                    <div className="flex items-center gap-2">
                        <Input
                            value={revision}
                            onChange={(e) => setRevision(e.target.value)}
                            placeholder="Any changes? e.g., 'Make the sky purple'"
                            disabled={briefLoading}
                            className="text-sm"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleRevise();
                            }}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRevise}
                            disabled={briefLoading || !revision.trim()}
                        >
                            {briefLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </div>

                    {/* Art Style Dropdown + Generate Image */}
                    <div className="flex items-center gap-3 justify-end">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                                Art Style:
                            </label>
                            <select
                                value={selectedStyle}
                                onChange={(e) => onStyleChange(e.target.value)}
                                disabled={imageLoading || briefLoading}
                                className="text-sm border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {ART_STYLES.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Button
                            onClick={() => onGenerateImage(selectedStyle)}
                            disabled={imageLoading || briefLoading}
                            className="gap-2"
                        >
                            {imageLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : hasImage ? (
                                <RefreshCw className="w-4 h-4" />
                            ) : (
                                <Wand2 className="w-4 h-4" />
                            )}
                            {hasImage ? "Regenerate Image" : "Generate Image"}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
