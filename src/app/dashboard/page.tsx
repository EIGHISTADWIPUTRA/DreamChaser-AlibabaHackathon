"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { signOut } from "next-auth/react";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    BookOpen,
    Palette,
    AudioLines,
    Eye,
    Loader2,
    Trash2,
    Send,
    CheckCircle2,
    Star,
    Library,
    LogOut,
} from "lucide-react";

interface StoryItem {
    id: number;
    title: string;
    status: string;
    teacherGrade: number | null;
    createdAt: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const { userId, username, role, classroomId, loading: sessionLoading } = useSession();
    const [stories, setStories] = useState<StoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [submitting, setSubmitting] = useState<number | null>(null);

    // Role-based redirect
    useEffect(() => {
        if (!sessionLoading && role === "TEACHER") {
            router.replace("/teacher/dashboard");
        }
    }, [sessionLoading, role, router]);

    // Student without classroom - redirect to join class
    useEffect(() => {
        if (!sessionLoading && role === "STUDENT" && classroomId === null) {
            router.replace("/student/join-class");
        }
    }, [sessionLoading, role, classroomId, router]);

    useEffect(() => {
        if (userId && role === "STUDENT" && classroomId !== null) fetchStories();
    }, [userId, role, classroomId]);

    const fetchStories = async () => {
        try {
            const res = await fetch("/api/stories");
            if (res.ok) {
                const data = await res.json();
                setStories(data.stories);
            }
        } finally {
            setLoading(false);
        }
    };

    const createStory = async () => {
        setCreating(true);
        try {
            const res = await fetch("/api/stories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: "" }),
            });
            if (res.ok) {
                const data = await res.json();
                router.push(`/write/${data.story.id}`);
            }
        } finally {
            setCreating(false);
        }
    };

    const deleteStory = async (id: number) => {
        if (!confirm("Delete this story?")) return;
        await fetch(`/api/stories/${id}`, { method: "DELETE" });
        setStories((prev) => prev.filter((s) => s.id !== id));
    };

    const submitStory = async (id: number) => {
        if (!confirm("Submit this story to your teacher for grading?")) return;
        setSubmitting(id);
        try {
            const res = await fetch(`/api/stories/${id}/submit`, { method: "POST" });
            if (res.ok) {
                setStories((prev) =>
                    prev.map((s) => (s.id === id ? { ...s, status: "submitted" } : s))
                );
            }
        } finally {
            setSubmitting(null);
        }
    };

    const getStoryUrl = (story: StoryItem) => {
        switch (story.status) {
            case "illustrating":
                return `/illustrate/${story.id}`;
            case "finalizing":
                return `/finalize/${story.id}`;
            case "completed":
            case "submitted":
            case "graded":
                return `/preview/${story.id}`;
            default:
                return `/write/${story.id}`;
        }
    };

    const statusConfig: Record<
        string,
        { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }
    > = {
        drafting: {
            label: "Writing",
            variant: "secondary",
            icon: <BookOpen className="w-3 h-3" />,
        },
        illustrating: {
            label: "Illustrating",
            variant: "outline",
            icon: <Palette className="w-3 h-3" />,
        },
        finalizing: {
            label: "Finalizing",
            variant: "outline",
            icon: <AudioLines className="w-3 h-3" />,
        },
        completed: {
            label: "Completed",
            variant: "default",
            icon: <Eye className="w-3 h-3" />,
        },
        submitted: {
            label: "Submitted",
            variant: "outline",
            icon: <Send className="w-3 h-3" />,
        },
        graded: {
            label: "Graded",
            variant: "default",
            icon: <Star className="w-3 h-3" />,
        },
    };

    // Show loading while checking session or redirecting
    if (sessionLoading || role === "TEACHER" || (role === "STUDENT" && classroomId === null)) {
        return (
            <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
            </div>
        );
    }

    return (
        <div className="flex h-screen">
            <Sidebar stories={stories} currentStoryId={null} />
            <main className="flex-1 overflow-y-auto bg-[#FFFBF5]">
                <div className="max-w-3xl mx-auto p-8 space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-stone-800">My Stories</h1>
                            <p className="text-sm text-stone-600 mt-1">
                                Welcome, <span className="font-medium">{username}</span> 👋
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push("/library")}
                                className="gap-2"
                            >
                                <Library className="w-4 h-4" />
                                Library
                            </Button>
                            <Button onClick={createStory} disabled={creating} className="gap-2">
                                {creating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                New Story
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                title="Sign out"
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : stories.length === 0 ? (
                        <div className="text-center py-16 space-y-4 border-2 border-dashed border-border rounded-xl">
                            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
                            <div>
                                <h3 className="font-semibold">No stories yet</h3>
                                <p className="text-sm text-muted-foreground">
                                    Create your first narrative text story
                                </p>
                            </div>
                            <Button onClick={createStory} disabled={creating}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Story
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stories.map((story) => {
                                const config =
                                    statusConfig[story.status] ?? statusConfig.drafting;
                                return (
                                    <div
                                        key={story.id}
                                        className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow cursor-pointer group"
                                        onClick={() => router.push(getStoryUrl(story))}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium truncate">
                                                {story.title || "Untitled Story"}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(story.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        {/* Grade badge */}
                                        {story.status === "graded" && story.teacherGrade !== null && (
                                            <Badge variant="default" className="gap-1 bg-green-500">
                                                <CheckCircle2 className="w-3 h-3" />
                                                {story.teacherGrade}/100
                                            </Badge>
                                        )}

                                        <Badge
                                            variant={config.variant}
                                            className="gap-1 text-xs shrink-0"
                                        >
                                            {config.icon}
                                            {config.label}
                                        </Badge>

                                        {/* Submit button for completed stories */}
                                        {story.status === "completed" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="shrink-0 gap-1 text-xs"
                                                disabled={submitting === story.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    submitStory(story.id);
                                                }}
                                            >
                                                {submitting === story.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Send className="w-3 h-3" />
                                                )}
                                                Submit
                                            </Button>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteStory(story.id);
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
