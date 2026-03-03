"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "@/hooks/useSession";
import {
    Loader2,
    BookOpen,
    ClipboardCheck,
    LogOut,
    Library,
    Eye,
    Clock,
    Plus,
    School,
    Copy,
    Check,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface ClassroomItem {
    id: number;
    name: string;
    classCode: string;
    _count: { students: number };
}

export default function TeacherDashboardPage() {
    const router = useRouter();
    const { username } = useSession();
    const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newClassName, setNewClassName] = useState("");
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    useEffect(() => {
        fetch("/api/classrooms")
            .then((r) => r.json())
            .then((data) => setClassrooms(data.classrooms || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const createClass = async () => {
        if (!newClassName.trim()) return;
        setCreating(true);
        try {
            const res = await fetch("/api/classrooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newClassName.trim() }),
            });
            if (res.ok) {
                const data = await res.json();
                setClassrooms((prev) => [
                    { ...data.classroom, _count: { students: 0 } },
                    ...prev,
                ]);
                setNewClassName("");
                setShowCreate(false);
            }
        } finally {
            setCreating(false);
        }
    };

    const copyCode = (id: number, code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const deleteClass = async (id: number) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/classrooms/${id}`, { method: "DELETE" });
            if (res.ok) {
                setClassrooms((prev) => prev.filter((c) => c.id !== id));
            }
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFBF5]">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <ClipboardCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-stone-800">Teacher Dashboard</h1>
                            <p className="text-xs text-stone-600">Welcome, {username}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push("/library")}
                            className="gap-2 border-orange-100"
                        >
                            <Library className="w-4 h-4" />
                            Library
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
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
                {/* Create Class */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                        <School className="w-5 h-5 text-orange-500" />
                        My Classes
                    </h2>
                    <Button
                        size="sm"
                        onClick={() => setShowCreate(!showCreate)}
                        className="gap-1 bg-orange-500 hover:bg-orange-600"
                    >
                        <Plus className="w-4 h-4" />
                        Create Class
                    </Button>
                </div>

                {showCreate && (
                    <div className="bg-white rounded-xl border border-orange-100 p-5 shadow-sm shadow-orange-100/50">
                        <div className="flex gap-3">
                            <Input
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                placeholder="Class name, e.g. Class 10A English"
                                className="flex-1 border-orange-100"
                                onKeyDown={(e) => e.key === "Enter" && createClass()}
                            />
                            <Button
                                onClick={createClass}
                                disabled={creating || !newClassName.trim()}
                                className="bg-orange-500 hover:bg-orange-600 gap-1"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Create
                            </Button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                    </div>
                ) : classrooms.length === 0 ? (
                    <div className="text-center py-16 space-y-4 border-2 border-dashed border-orange-100 rounded-xl bg-white">
                        <School className="w-12 h-12 text-stone-300 mx-auto" />
                        <h3 className="font-semibold text-stone-800">No classes yet</h3>
                        <p className="text-sm text-stone-600">
                            Create your first class and share the code with your students.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {classrooms.map((cls) => (
                            <div
                                key={cls.id}
                                className="bg-white rounded-xl border border-orange-100 p-5 shadow-sm shadow-orange-100/50 hover:shadow-md transition-shadow cursor-pointer group"
                                onClick={() => router.push(`/teacher/class/${cls.id}`)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-stone-800 text-lg">{cls.name}</h3>
                                    <Badge variant="outline" className="text-stone-600 border-orange-100 shrink-0">
                                        {cls._count.students} students
                                    </Badge>
                                </div>

                                {/* Class Code */}
                                <div className="flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-2">
                                    <span className="text-xs text-stone-600 font-medium">Code:</span>
                                    <span className="font-mono font-bold text-orange-600 tracking-widest text-lg">
                                        {cls.classCode}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyCode(cls.id, cls.classCode);
                                        }}
                                        className="ml-auto text-stone-400 hover:text-orange-500 transition-colors"
                                    >
                                        {copiedId === cls.id ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <p className="text-xs text-stone-600 flex items-center gap-1">
                                        <Eye className="w-3 h-3" />
                                        Click to view students & submissions
                                    </p>
                                    {confirmDeleteId === cls.id ? (
                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            <span className="text-xs text-red-500 font-medium">Delete?</span>
                                            <button
                                                onClick={() => deleteClass(cls.id)}
                                                disabled={deletingId === cls.id}
                                                className="text-xs bg-red-500 hover:bg-red-600 text-white rounded px-2 py-0.5 font-medium transition-colors"
                                            >
                                                {deletingId === cls.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Yes"}
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="text-xs bg-stone-200 hover:bg-stone-300 text-stone-700 rounded px-2 py-0.5 font-medium transition-colors"
                                            >
                                                No
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(cls.id); }}
                                            className="text-stone-400 hover:text-red-400 transition-colors rounded p-1"
                                            title="Delete class"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
