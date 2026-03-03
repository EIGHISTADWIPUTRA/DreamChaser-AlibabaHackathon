"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    ArrowLeft,
    Copy,
    Check,
    BookOpen,
    Eye,
    ClipboardCheck,
    Users,
} from "lucide-react";

interface StudentData {
    id: number;
    username: string;
    stories: {
        id: number;
        title: string;
        status: string;
        teacherGrade: number | null;
        createdAt: string;
    }[];
}

interface ClassroomData {
    id: number;
    name: string;
    classCode: string;
    students: StudentData[];
}

export default function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
    const { classId } = use(params);
    const router = useRouter();
    const [classroom, setClassroom] = useState<ClassroomData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetch(`/api/classrooms/${classId}`)
            .then((r) => r.json())
            .then((data) => setClassroom(data.classroom))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [classId]);

    const copyCode = () => {
        if (!classroom) return;
        navigator.clipboard.writeText(classroom.classCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
            </div>
        );
    }

    if (!classroom) {
        return (
            <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
                <p className="text-stone-600">Class not found</p>
            </div>
        );
    }

    const pendingStories = classroom.students.flatMap((s) =>
        s.stories
            .filter((st) => st.status === "submitted")
            .map((st) => ({ ...st, studentName: s.username }))
    );

    const gradedStories = classroom.students.flatMap((s) =>
        s.stories
            .filter((st) => st.status === "graded")
            .map((st) => ({ ...st, studentName: s.username }))
    );

    return (
        <div className="min-h-screen bg-[#FFFBF5]">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/teacher/dashboard")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold text-stone-800">{classroom.name}</h1>
                            <p className="text-xs text-stone-600">{classroom.students.length} students enrolled</p>
                        </div>
                    </div>

                    {/* Class Code */}
                    <button
                        onClick={copyCode}
                        className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-4 py-2 hover:bg-orange-100 transition-colors"
                    >
                        <span className="text-xs text-stone-600 font-medium">Class Code:</span>
                        <span className="font-mono font-bold text-orange-600 tracking-widest text-xl">
                            {classroom.classCode}
                        </span>
                        {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <Copy className="w-4 h-4 text-stone-400" />
                        )}
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
                {/* Pending Submissions */}
                <section>
                    <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-amber-500" />
                        Pending Submissions ({pendingStories.length})
                    </h2>
                    {pendingStories.length === 0 ? (
                        <div className="bg-white rounded-xl border border-orange-100 p-8 text-center">
                            <BookOpen className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                            <p className="text-sm text-stone-600">No pending submissions from this class</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingStories.map((story) => (
                                <div
                                    key={story.id}
                                    className="flex items-center gap-4 p-4 rounded-xl border border-orange-100 bg-white shadow-sm shadow-orange-100/50"
                                >
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-stone-800 truncate">
                                            {story.title || "Untitled Story"}
                                        </h3>
                                        <p className="text-xs text-stone-600">
                                            by {story.studentName} • {new Date(story.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/preview/${story.id}`)}
                                            className="gap-1 border-orange-100"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            Preview
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => router.push(`/teacher/grade/${story.id}`)}
                                            className="gap-1 bg-orange-500 hover:bg-orange-600"
                                        >
                                            <ClipboardCheck className="w-3.5 h-3.5" />
                                            Grade
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Students */}
                <section>
                    <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-orange-500" />
                        Students ({classroom.students.length})
                    </h2>
                    {classroom.students.length === 0 ? (
                        <div className="bg-white rounded-xl border border-orange-100 p-8 text-center">
                            <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                            <p className="text-sm text-stone-600">
                                No students yet. Share the class code <strong className="text-orange-600">{classroom.classCode}</strong> with your students.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-orange-100 overflow-hidden shadow-sm shadow-orange-100/50">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-orange-50 bg-orange-50/50">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wider">Student</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wider">Stories</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wider">Submitted</th>
                                        <th className="text-center px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wider">Graded</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-orange-50">
                                    {classroom.students.map((student) => {
                                        const submitted = student.stories.filter((s) => s.status === "submitted").length;
                                        const graded = student.stories.filter((s) => s.status === "graded").length;
                                        return (
                                            <tr key={student.id} className="hover:bg-orange-50/30 transition-colors">
                                                <td className="px-4 py-3 font-medium text-stone-800">{student.username}</td>
                                                <td className="px-4 py-3 text-center text-sm text-stone-600">{student.stories.length}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {submitted > 0 ? (
                                                        <Badge className="bg-amber-100 text-amber-700 border-0">{submitted}</Badge>
                                                    ) : (
                                                        <span className="text-sm text-stone-400">0</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {graded > 0 ? (
                                                        <Badge className="bg-green-100 text-green-700 border-0">{graded}</Badge>
                                                    ) : (
                                                        <span className="text-sm text-stone-400">0</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Graded (published) */}
                {gradedStories.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-500" />
                            Published to Library ({gradedStories.length})
                        </h2>
                        <div className="space-y-2">
                            {gradedStories.map((story) => (
                                <div key={story.id} className="flex items-center gap-4 p-3 rounded-lg border border-green-100 bg-white/60">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-stone-800 truncate">{story.title || "Untitled"}</p>
                                        <p className="text-xs text-stone-600">by {story.studentName}</p>
                                    </div>
                                    <Badge className="bg-green-50 text-green-600 border-0">
                                        {story.teacherGrade}/100
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
