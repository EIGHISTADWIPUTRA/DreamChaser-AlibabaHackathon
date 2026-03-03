"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, BookOpen, ArrowRight } from "lucide-react";
import { useSession } from "@/hooks/useSession";

export default function JoinClassPage() {
    const router = useRouter();
    const { role, classroomId, loading: sessionLoading } = useSession();
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Guard: redirect if already in a class or is a teacher
    useEffect(() => {
        if (sessionLoading) return;
        if (role === "TEACHER") {
            router.replace("/teacher/dashboard");
        } else if (role === "STUDENT" && classroomId !== null) {
            router.replace("/dashboard");
        }
    }, [sessionLoading, role, classroomId, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/classrooms/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ classCode: code.trim().toUpperCase() }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Invalid code");
                setLoading(false);
                return;
            }

            router.push("/dashboard");
        } catch {
            setError("Something went wrong");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center px-4">
            {/* Show spinner while session is loading or redirect is in progress */}
            {(sessionLoading || (role === "TEACHER") || (role === "STUDENT" && classroomId !== null)) ? (
                <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
            ) : (
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg shadow-orange-200 mb-6">
                        <BookOpen className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-stone-800 font-serif">Join Your Class</h1>
                    <p className="text-stone-600 mt-3 leading-relaxed">
                        Ask your teacher for the <span className="font-semibold text-orange-500">6-digit class code</span> and enter it below to get started.
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-sm shadow-orange-100/50 border border-orange-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-800">
                                Class Code
                            </label>
                            <Input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="e.g. ENG10A"
                                maxLength={6}
                                className="h-14 text-center text-2xl font-mono font-bold tracking-[0.3em] uppercase border-orange-100 focus-visible:ring-orange-300"
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 text-center">{error}</p>
                        )}

                        <Button
                            type="submit"
                            disabled={loading || code.trim().length < 3}
                            className="w-full h-12 gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium text-base"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ArrowRight className="w-4 h-4" />
                            )}
                            Join Class
                        </Button>
                    </form>
                </div>

                <p className="text-center text-xs text-stone-600 mt-6">
                    Don&apos;t have a code? Ask your English teacher for the class code.
                </p>
            </div>
            )}
        </div>
    );
}
