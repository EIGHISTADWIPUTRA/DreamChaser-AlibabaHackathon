"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#FFFBF5] font-sans text-stone-800">
            {/* ═══════════════ NAV ═══════════════ */}
            <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#FFFBF5]/80 border-b border-orange-100/50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="font-serif text-2xl font-bold tracking-tight text-stone-800">
                        Nusara
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/library">
                            <Button
                                variant="ghost"
                                className="text-stone-600 hover:text-stone-900 hover:bg-orange-50 rounded-full px-5 py-2 font-medium"
                            >
                                Library
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 shadow-sm shadow-orange-100/50 font-medium">
                                Start Writing
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ═══════════════ A. HERO ═══════════════ */}
            <section className="bg-gradient-to-b from-[#FFFBF5] to-orange-50/40 py-32 px-6 flex flex-col items-center text-center pb-40">
                <div className="max-w-4xl mx-auto space-y-8 flex flex-col items-center">
                    <div className="bg-white border border-orange-100 text-stone-600 rounded-full px-6 py-2 text-sm font-medium shadow-sm shadow-orange-100/50">
                        For Teachers &amp; Students
                    </div>
                    <h1 className="font-serif text-5xl md:text-7xl font-bold text-stone-800 leading-tight tracking-tight max-w-3xl mx-auto">
                        Write stories that come alive.
                    </h1>
                    <p className="text-xl text-stone-600 leading-relaxed max-w-2xl mx-auto">
                        A friendly space to practice English narrative texts. Write step-by-step, get gentle guidance, and turn your words into a beautiful flipbook.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                        <Link href="/login">
                            <Button
                                size="lg"
                                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 py-7 text-lg font-medium shadow-md shadow-orange-200 transition-all hover:-translate-y-0.5"
                            >
                                Start Writing
                            </Button>
                        </Link>
                        <Link href="/library">
                            <Button
                                variant="outline"
                                size="lg"
                                className="rounded-full px-8 py-7 text-lg font-medium border-2 border-orange-100 text-stone-600 hover:border-orange-200 hover:bg-orange-50 bg-transparent transition-all"
                            >
                                Explore Library
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════ B. TUTORS ═══════════════ */}
            <section className="py-32 bg-white px-6 border-t border-orange-100/30">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="font-serif text-4xl md:text-5xl font-bold text-stone-800 tracking-tight">
                            Meet Your Tutors
                        </h2>
                        <p className="text-xl text-stone-600 mt-4 max-w-xl mx-auto">
                            Three invisible guides to support your writing journey—always helpful, never judgmental.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                        {/* 01 Structure */}
                        <div className="relative bg-[#FFFBF5] p-10 rounded-[2rem] border border-orange-100 shadow-sm shadow-orange-100/50 overflow-hidden flex flex-col justify-end min-h-[320px] transition-transform hover:-translate-y-1">
                            <div className="absolute top-2 -right-4 text-[10rem] font-serif font-bold text-orange-100/60 leading-none select-none z-0">
                                01
                            </div>
                            <div className="relative z-10 space-y-4">
                                <h3 className="font-serif text-3xl font-bold text-stone-800">Structure</h3>
                                <p className="text-stone-600 leading-relaxed text-lg">
                                    Understand the anatomy of a great story. Learn how to shape your narrative from a captivating Orientation to a satisfying Resolution.
                                </p>
                            </div>
                        </div>

                        {/* 02 Grammar */}
                        <div className="relative bg-[#FFFBF5] p-10 rounded-[2rem] border border-orange-100 shadow-sm shadow-orange-100/50 overflow-hidden flex flex-col justify-end min-h-[320px] transition-transform hover:-translate-y-1">
                            <div className="absolute top-2 -right-4 text-[10rem] font-serif font-bold text-sky-100/60 leading-none select-none z-0">
                                02
                            </div>
                            <div className="relative z-10 space-y-4">
                                <h3 className="font-serif text-3xl font-bold text-stone-800">Grammar</h3>
                                <p className="text-stone-600 leading-relaxed text-lg">
                                    Write with confidence. Receive gentle, easy-to-understand suggestions to improve your sentences and vocabulary without feeling judged.
                                </p>
                            </div>
                        </div>

                        {/* 03 Brainstorm */}
                        <div className="relative bg-[#FFFBF5] p-10 rounded-[2rem] border border-orange-100 shadow-sm shadow-orange-100/50 overflow-hidden flex flex-col justify-end min-h-[320px] transition-transform hover:-translate-y-1">
                            <div className="absolute top-2 -right-4 text-[10rem] font-serif font-bold text-emerald-100/60 leading-none select-none z-0">
                                03
                            </div>
                            <div className="relative z-10 space-y-4">
                                <h3 className="font-serif text-3xl font-bold text-stone-800">Brainstorm</h3>
                                <p className="text-stone-600 leading-relaxed text-lg">
                                    Overcome writer&apos;s block. Explore imaginative prompts and guiding questions that spark creativity and expand your ideas.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════ C. TEACHERS ═══════════════ */}
            <section className="py-32 bg-[#FFFBF5] text-center px-6 border-t border-orange-100/30">
                <div className="max-w-3xl mx-auto space-y-8 flex flex-col items-center">
                    <h2 className="font-serif text-4xl md:text-5xl font-bold text-stone-800 tracking-tight">
                        A mindful tool for the classroom
                    </h2>
                    <p className="text-xl text-stone-600 leading-relaxed max-w-2xl">
                        Help students practice writing skills, enrich their vocabulary, and master Narrative Text structures in a supportive environment. Give them the joy of seeing their hard work become a real storybook.
                    </p>
                    <div className="pt-8 w-full max-w-sm">
                        <Link href="/login">
                            <Button
                                size="lg"
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full px-10 py-7 text-lg font-medium shadow-md shadow-orange-200 transition-all hover:-translate-y-0.5"
                            >
                                Try It in Your Class
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══════════════ FOOTER ═══════════════ */}
            <footer className="py-12 bg-white border-t border-orange-100 text-center px-6">
                <p className="text-sm text-stone-600 font-medium">
                    Nusara &mdash; Built thoughtfully for English Teachers &amp; Students
                </p>
                <p className="text-sm text-stone-600 mt-2">
                    Powered by Alibaba Cloud DashScope
                </p>
            </footer>
        </div>
    );
}
