"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, BookOpen, UserPlus, GraduationCap, School } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, role }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Registration failed");
                setLoading(false);
                return;
            }

            // Auto login after register
            const result = await signIn("credentials", {
                username,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Registered but login failed. Please go to login page.");
                setLoading(false);
                return;
            }

            if (role === "TEACHER") {
                router.push("/teacher/dashboard");
            } else {
                router.push("/dashboard");
            }
        } catch {
            setError("Something went wrong");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg mb-4">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
                    <p className="text-sm text-slate-500 mt-1">Join the AI Narrative Platform</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-orange-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Role Selector */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">I am a...</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole("STUDENT")}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${role === "STUDENT"
                                            ? "border-orange-400 bg-orange-50 shadow-sm"
                                            : "border-slate-200 hover:border-slate-300"
                                        }`}
                                >
                                    <GraduationCap className={`w-6 h-6 ${role === "STUDENT" ? "text-orange-500" : "text-slate-400"}`} />
                                    <span className={`text-sm font-medium ${role === "STUDENT" ? "text-orange-700" : "text-slate-500"}`}>
                                        Student
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole("TEACHER")}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${role === "TEACHER"
                                            ? "border-blue-400 bg-blue-50 shadow-sm"
                                            : "border-slate-200 hover:border-slate-300"
                                        }`}
                                >
                                    <School className={`w-6 h-6 ${role === "TEACHER" ? "text-blue-500" : "text-slate-400"}`} />
                                    <span className={`text-sm font-medium ${role === "TEACHER" ? "text-blue-700" : "text-slate-500"}`}>
                                        Teacher
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Username</label>
                            <Input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Choose a username"
                                required
                                minLength={3}
                                maxLength={30}
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Choose a password"
                                required
                                minLength={4}
                                className="h-11"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                        )}

                        <Button type="submit" disabled={loading} className="w-full h-11 gap-2">
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <UserPlus className="w-4 h-4" />
                            )}
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500">
                            Already have an account?{" "}
                            <Link href="/login" className="text-orange-500 font-medium hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
