"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useSession as useNextAuthSession } from "next-auth/react";
import { type ReactNode, useEffect, useState } from "react";

interface SessionState {
    userId: number | null;
    username: string | null;
    role: string | null;
    classroomId: number | null;
    /** true while the session JWT is loading OR while the classroomId is being
     *  fetched from /api/session.  Always wait for loading=false before
     *  making any redirect decisions. */
    loading: boolean;
}

export function SessionProvider({ children }: { children: ReactNode }) {
    return (
        <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
    );
}

export function useSession(): SessionState {
    const { data: session, status } = useNextAuthSession();
    const [classroomId, setClassroomId] = useState<number | null>(null);
    const [classroomFetched, setClassroomFetched] = useState(false);

    useEffect(() => {
        if (status === "authenticated") {
            setClassroomFetched(false);
            fetch("/api/session")
                .then((r) => r.json())
                .then((data) => setClassroomId(data.classroomId ?? null))
                .catch(() => setClassroomId(null))
                .finally(() => setClassroomFetched(true));
        } else if (status === "unauthenticated") {
            setClassroomId(null);
            setClassroomFetched(true);
        }
    }, [status]);

    return {
        userId: session?.user?.id ? parseInt(session.user.id) : null,
        username: session?.user?.name ?? null,
        role: (session?.user as { role?: string } | undefined)?.role ?? null,
        classroomId,
        // Stay loading until BOTH the NextAuth session AND the /api/session call
        // have completed.  This prevents premature redirect decisions.
        loading: status === "loading" || (status === "authenticated" && !classroomFetched),
    };
}
