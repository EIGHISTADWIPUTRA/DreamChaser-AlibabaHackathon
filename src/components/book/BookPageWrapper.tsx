"use client";

import React from "react";

interface BookPageWrapperProps {
    children: React.ReactNode;
    pagePosition: "left" | "right";
    className?: string;
}

/**
 * Universal page wrapper for all flipbook pages.
 * Provides paper background, spine shadow, margin, and framed content box.
 */
export default function BookPageWrapper({
    children,
    pagePosition,
    className = "",
}: BookPageWrapperProps) {
    return (
        <div className={`w-full h-full bg-[#FDFBF7] overflow-hidden relative ${className}`}>
            {/* Book spine shadow */}
            {pagePosition === "left" ? (
                <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/[0.06] to-transparent z-10 pointer-events-none" />
            ) : (
                <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/[0.06] to-transparent z-10 pointer-events-none" />
            )}

            {/* Page margin */}
            <div className="w-full h-full p-5">
                {/* Content box with framed look */}
                <div className="w-full h-full bg-white rounded-2xl border-2 border-orange-100/80 shadow-sm overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    );
}
