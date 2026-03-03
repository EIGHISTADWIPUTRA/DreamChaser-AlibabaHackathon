"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Plus,
    BookOpen,
    Palette,
    AudioLines,
    Eye,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Home,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StoryItem {
    id: number;
    title: string;
    status: string;
    createdAt: string;
}

interface SidebarProps {
    stories: StoryItem[];
    currentStoryId: number | null;
}

export default function Sidebar({ stories: initialStories, currentStoryId }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { userId } = useSession();
    const [collapsed, setCollapsed] = useState(false);
    const [stories, setStories] = useState<StoryItem[]>(initialStories);
    const [loading, setLoading] = useState(false);

    // Fetch stories if none provided
    useEffect(() => {
        if (initialStories.length === 0 && userId) {
            setLoading(true);
            fetch("/api/stories")
                .then((res) => res.json())
                .then((data) => setStories(data.stories ?? []))
                .finally(() => setLoading(false));
        }
    }, [userId, initialStories.length]);

    const getStoryUrl = (story: StoryItem) => {
        switch (story.status) {
            case "illustrating":
                return `/illustrate/${story.id}`;
            case "finalizing":
                return `/finalize/${story.id}`;
            case "completed":
                return `/preview/${story.id}`;
            default:
                return `/write/${story.id}`;
        }
    };

    const statusIcons: Record<string, React.ReactNode> = {
        drafting: <BookOpen className="w-3 h-3" />,
        illustrating: <Palette className="w-3 h-3" />,
        finalizing: <AudioLines className="w-3 h-3" />,
        completed: <Eye className="w-3 h-3" />,
    };

    const createStory = async () => {
        const res = await fetch("/api/stories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "" }),
        });
        if (res.ok) {
            const data = await res.json();
            router.push(`/write/${data.story.id}`);
        }
    };

    const deleteStory = async (id: number) => {
        if (!confirm("Delete this story?")) return;
        await fetch(`/api/stories/${id}`, { method: "DELETE" });
        setStories((prev) => prev.filter((s) => s.id !== id));
        if (currentStoryId === id) {
            router.push("/dashboard");
        }
    };

    if (collapsed) {
        return (
            <div className="w-12 flex flex-col items-center py-3 border-r border-border bg-card shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(false)}
                    className="mb-2"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push("/dashboard")}
                >
                    <Home className="w-4 h-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="w-64 flex flex-col border-r border-border bg-card shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/dashboard")}
                    className="gap-1.5 text-xs font-semibold"
                >
                    <Home className="w-3.5 h-3.5" />
                    Dashboard
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCollapsed(true)}
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
            </div>

            <Separator />

            <div className="px-3 py-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={createStory}
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Story
                </Button>
            </div>

            <Separator />

            {/* Story List */}
            <ScrollArea className="flex-1">
                <div className="px-2 py-1 space-y-0.5">
                    {loading && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    {stories.map((story) => {
                        const isActive = story.id === currentStoryId;
                        return (
                            <div
                                key={story.id}
                                className={cn(
                                    "flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-sm group transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-muted"
                                )}
                                onClick={() =>
                                    router.push(getStoryUrl(story))
                                }
                            >
                                <span className="shrink-0">
                                    {statusIcons[story.status] ??
                                        statusIcons.drafting}
                                </span>
                                <span className="flex-1 min-w-0 truncate text-xs">
                                    {story.title || "Untitled"}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteStory(story.id);
                                    }}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
