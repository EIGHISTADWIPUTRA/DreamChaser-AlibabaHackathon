"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { BookOpen, Star, Loader2, Library as LibraryIcon, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface LibraryStory {
    id: number;
    title: string;
    teacherGrade: number | null;
    createdAt: string;
    user: { username: string };
    sections: { sectionType: string; imageUrl: string | null }[];
}

export default function LibraryPage() {
    const router = useRouter();
    const { userId, loading: sessionLoading } = useSession();
    const [stories, setStories] = useState<LibraryStory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        if (sessionLoading) return;

        const limit = userId ? "" : "?limit=5";
        setIsGuest(!userId);

        fetch(`/api/stories/library${limit}`)
            .then((r) => r.json())
            .then((data) => setStories(data.stories || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [userId, sessionLoading]);

    return (
        <div className="min-h-screen bg-[#FFFBF5]">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-sm shadow-orange-100/50">
                            <LibraryIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-stone-800">Story Library</h1>
                            <p className="text-xs text-stone-600">Published &amp; graded stories</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isGuest ? (
                            <Link href="/login">
                                <Button size="sm" className="gap-2 bg-orange-500 hover:bg-orange-600 rounded-full">
                                    <LogIn className="w-3.5 h-3.5" />
                                    Sign In
                                </Button>
                            </Link>
                        ) : (
                            <button
                                onClick={() => router.back()}
                                className="text-sm text-orange-500 hover:underline font-medium"
                            >
                                ← Back
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10">
                {loading ? (
                    <div className="flex items-center justify-center h-60">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
                    </div>
                ) : stories.length === 0 ? (
                    <div className="text-center py-20 space-y-4">
                        <BookOpen className="w-16 h-16 text-stone-300 mx-auto" />
                        <h2 className="text-xl font-semibold text-stone-600">No stories published yet</h2>
                        <p className="text-sm text-stone-600">
                            Stories will appear here once teachers have graded and published them.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {stories.map((story) => {
                                const coverImage = story.sections.find(
                                    (s) => s.sectionType === "title"
                                )?.imageUrl;

                                return (
                                    <div
                                        key={story.id}
                                        onClick={() => router.push(`/preview/${story.id}`)}
                                        className="bg-white rounded-2xl border border-orange-100 shadow-sm shadow-orange-100/50 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                                    >
                                        {/* Cover Image */}
                                        <div className="aspect-[3/4] bg-gradient-to-br from-orange-50 to-amber-50 relative overflow-hidden">
                                            {coverImage ? (
                                                <img
                                                    src={coverImage}
                                                    alt={story.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <BookOpen className="w-12 h-12 text-orange-200" />
                                                </div>
                                            )}

                                            {/* Grade Badge */}
                                            {story.teacherGrade !== null && (
                                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 shadow-sm">
                                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                    <span className="text-sm font-bold text-stone-800">
                                                        {story.teacherGrade}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="p-4">
                                            <h3 className="font-semibold text-stone-800 truncate">
                                                {story.title || "Untitled Story"}
                                            </h3>
                                            <p className="text-xs text-stone-600 mt-1">
                                                by {story.user.username} •{" "}
                                                {new Date(story.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Guest Banner */}
                        {isGuest && stories.length >= 5 && (
                            <div className="mt-12 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-8 text-center">
                                <Sparkles className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                                <h3 className="text-xl font-bold text-stone-800 mb-2">
                                    There&apos;s so much more to explore!
                                </h3>
                                <p className="text-stone-600 mb-6 max-w-md mx-auto">
                                    Log in to unlock and explore hundreds of other magical stories created by students just like you.
                                </p>
                                <Link href="/login">
                                    <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 py-3 font-medium shadow-md shadow-orange-200">
                                        <LogIn className="w-4 h-4 mr-2" />
                                        Log In to See More
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
