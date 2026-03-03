"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Lock, RefreshCw } from "lucide-react";

interface ImagePreviewProps {
    imageUrl: string;
    onRegenerate: () => void;
    onLockAndProceed: () => void;
    imageLoading: boolean;
    lockLoading: boolean;
}

export default function ImagePreview({
    imageUrl,
    onRegenerate,
    onLockAndProceed,
    imageLoading,
    lockLoading,
}: ImagePreviewProps) {
    return (
        <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border border-border bg-muted/20">
                <img
                    src={imageUrl}
                    alt="Generated illustration"
                    className="w-full h-auto max-h-[400px] object-contain"
                />
            </div>

            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={onRegenerate}
                    disabled={imageLoading || lockLoading}
                    className="gap-2"
                >
                    {imageLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4" />
                    )}
                    Regenerate Image
                </Button>

                <Button
                    onClick={onLockAndProceed}
                    disabled={lockLoading || imageLoading}
                    className="gap-2"
                >
                    {lockLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Lock className="w-4 h-4" />
                    )}
                    Lock & Proceed
                </Button>
            </div>
        </div>
    );
}
