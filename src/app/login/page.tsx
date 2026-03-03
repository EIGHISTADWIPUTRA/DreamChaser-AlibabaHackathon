"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, BookOpen, LogIn } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await signIn("credentials", {
            username,
            password,
            redirect: false,
        });

        if (result?.error) {
            setError("Invalid username or password");
            setLoading(false);
            return;
        }

        // Fetch session to get role for redirect
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        const role = session?.user?.role;

        if (role === "TEACHER") {
            router.push("/teacher/dashboard");
        } else {
            router.push("/dashboard");
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
                    <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
                    <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-orange-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Username</label>
                            <Input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                                className="h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
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
                                <LogIn className="w-4 h-4" />
                            )}
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="text-orange-500 font-medium hover:underline">
                                Register here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Demo Credentials */}
                <div className="mt-4 bg-white/70 border border-orange-100 rounded-2xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Demo Accounts</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => { setUsername("student"); setPassword("student"); }}
                            className="bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-xl p-3 text-left transition-colors cursor-pointer"
                        >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400 mb-1">Student</p>
                            <p className="text-xs text-slate-600 font-mono">user: <span className="font-bold">student</span></p>
                            <p className="text-xs text-slate-600 font-mono">pass: <span className="font-bold">student</span></p>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setUsername("teacher"); setPassword("teacher"); }}
                            className="bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl p-3 text-left transition-colors cursor-pointer"
                        >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Teacher</p>
                            <p className="text-xs text-slate-600 font-mono">user: <span className="font-bold">teacher</span></p>
                            <p className="text-xs text-slate-600 font-mono">pass: <span className="font-bold">teacher</span></p>
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">Click a card to auto-fill credentials</p>
                </div>

                <p className="text-center text-xs text-slate-400 mt-4">
                    Nusara
                </p>
            </div>
        </div>
    );
}
