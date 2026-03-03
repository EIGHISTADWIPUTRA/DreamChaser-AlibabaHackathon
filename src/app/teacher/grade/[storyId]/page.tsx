"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    Brain,
    Send,
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Star,
    TrendingUp,
    Target,
    Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Section {
    sectionType: string;
    textContent: string;
    imageUrl: string | null;
}

interface StoryData {
    id: number;
    title: string;
    status: string;
    user: { username: string };
    sections: Section[];
}

interface AIEvaluation {
    suggestedGrade: number;
    structure: { score: number; feedback: string };
    language: { score: number; feedback: string };
    creativity: { score: number; feedback: string };
    overallFeedback: string;
    strengths: string[];
    improvements: string[];
}

export default function GradingPage({ params }: { params: Promise<{ storyId: string }> }) {
    const { storyId } = use(params);
    const router = useRouter();
    const [story, setStory] = useState<StoryData | null>(null);
    const [loading, setLoading] = useState(true);

    const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null);
    const [evalLoading, setEvalLoading] = useState(false);
    const [evalError, setEvalError] = useState("");

    const [grade, setGrade] = useState("");
    const [feedback, setFeedback] = useState("");
    const [grading, setGrading] = useState(false);

    useEffect(() => {
        fetch(`/api/stories/${storyId}`)
            .then((r) => r.json())
            .then((data) => {
                setStory(data.story);
                // Auto-fetch AI eval if already cached
                if (data.story?.aiGradingSuggestion) {
                    setEvaluation(JSON.parse(data.story.aiGradingSuggestion));
                }
            })
            .finally(() => setLoading(false));
    }, [storyId]);

    const runAIEvaluation = async () => {
        setEvalLoading(true);
        setEvalError("");
        try {
            const res = await fetch("/api/ai/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storyId: parseInt(storyId) }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed");
            }
            const data = await res.json();
            setEvaluation(data.evaluation);
            setGrade(String(data.evaluation.suggestedGrade));
        } catch (err) {
            setEvalError((err as Error).message);
        } finally {
            setEvalLoading(false);
        }
    };

    const publishGrade = async () => {
        if (!grade) return;
        setGrading(true);
        try {
            const res = await fetch(`/api/stories/${storyId}/grade`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ grade: parseInt(grade), feedback }),
            });
            if (res.ok) {
                router.push("/teacher/dashboard");
            }
        } finally {
            setGrading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
        );
    }

    if (!story) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-500">Story not found</p>
            </div>
        );
    }

    const sectionOrder = ["orientation", "complication", "resolution", "reorientation"];
    const orderedSections = sectionOrder
        .map((type) => story.sections.find((s) => s.sectionType === type))
        .filter(Boolean) as Section[];

    const sectionLabels: Record<string, string> = {
        orientation: "Orientation",
        complication: "Complication",
        resolution: "Resolution",
        reorientation: "Reorientation",
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push("/teacher/dashboard")}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold text-slate-800 truncate max-w-md">
                                {story.title || "Untitled Story"}
                            </h1>
                            <p className="text-xs text-slate-400">by {story.user.username}</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-amber-600 border-amber-200">
                        {story.status}
                    </Badge>
                </div>
            </header>

            {/* Split Layout */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                {/* LEFT PANEL: Story Content */}
                <div className="space-y-5 max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                        Student&apos;s Story
                    </h2>

                    {orderedSections.map((section) => (
                        <div
                            key={section.sectionType}
                            className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
                        >
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
                                {sectionLabels[section.sectionType] || section.sectionType}
                            </p>
                            {section.imageUrl && (
                                <img
                                    src={section.imageUrl}
                                    alt={section.sectionType}
                                    className="w-full h-auto object-contain rounded-md bg-stone-100"
                                />
                            )}
                            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                                {section.textContent || "(No text)"}
                            </p>
                        </div>
                    ))}
                </div>

                {/* RIGHT PANEL: AI Evaluation + Grading Form */}
                <div className="space-y-5 max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
                    {/* AI Evaluation Card */}
                    <div className="bg-white rounded-xl border border-blue-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-500 flex items-center gap-2">
                                <Brain className="w-4 h-4" />
                                AI Evaluation
                            </h2>
                            {!evaluation && (
                                <Button
                                    size="sm"
                                    onClick={runAIEvaluation}
                                    disabled={evalLoading}
                                    className="gap-1 bg-blue-500 hover:bg-blue-600"
                                >
                                    {evalLoading ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-3.5 h-3.5" />
                                    )}
                                    Run AI Analysis
                                </Button>
                            )}
                        </div>

                        {evalLoading && (
                            <div className="flex items-center gap-3 text-sm text-blue-500 py-6">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Qwen is analyzing the narrative...
                            </div>
                        )}

                        {evalError && (
                            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 rounded-lg p-3">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {evalError}
                            </div>
                        )}

                        {evaluation && (
                            <div className="space-y-4">
                                {/* Suggested Grade */}
                                <div className="text-center py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                                    <p className="text-xs text-blue-500 font-medium mb-1">AI Suggested Grade</p>
                                    <p className="text-4xl font-extrabold text-blue-600">
                                        {evaluation.suggestedGrade}
                                        <span className="text-lg text-blue-300">/100</span>
                                    </p>
                                </div>

                                {/* Rubric */}
                                <div className="space-y-3">
                                    {[
                                        { label: "Structure", data: evaluation.structure, max: 30, icon: <Target className="w-3.5 h-3.5" /> },
                                        { label: "Language", data: evaluation.language, max: 30, icon: <BookOpen className="w-3.5 h-3.5" /> },
                                        { label: "Creativity", data: evaluation.creativity, max: 40, icon: <Sparkles className="w-3.5 h-3.5" /> },
                                    ].map((item) => (
                                        <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                                                    {item.icon} {item.label}
                                                </span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {item.data.score}/{item.max}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-500">{item.data.feedback}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Strengths & Improvements */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-green-50 rounded-lg p-3">
                                        <p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" /> Strengths
                                        </p>
                                        <ul className="space-y-1">
                                            {evaluation.strengths.map((s, i) => (
                                                <li key={i} className="text-xs text-green-700">• {s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-amber-50 rounded-lg p-3">
                                        <p className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> To Improve
                                        </p>
                                        <ul className="space-y-1">
                                            {evaluation.improvements.map((s, i) => (
                                                <li key={i} className="text-xs text-amber-700">• {s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Overall */}
                                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 italic">
                                    &ldquo;{evaluation.overallFeedback}&rdquo;
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Grading Form */}
                    <div className="bg-white rounded-xl border border-green-100 p-5">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-green-600 flex items-center gap-2 mb-4">
                            <CheckCircle2 className="w-4 h-4" />
                            Your Grade
                        </h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">
                                    Final Grade (0-100)
                                </label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                    placeholder="e.g. 85"
                                    className="h-11 text-lg font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">
                                    Feedback for Student
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Write personal feedback for the student..."
                                    rows={4}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-300"
                                />
                            </div>

                            <Button
                                onClick={publishGrade}
                                disabled={!grade || grading}
                                className="w-full h-11 gap-2 bg-green-500 hover:bg-green-600"
                            >
                                {grading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                Publish to Library
                            </Button>

                            <p className="text-[10px] text-slate-400 text-center">
                                Publishing will grade this story and make it visible in the public library.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
