import { auth } from "@/lib/auth";

/**
 * Get the authenticated user's ID from NextAuth session.
 * Returns null if not authenticated.
 */
export async function getSessionUserId(): Promise<number | null> {
    const session = await auth();
    if (!session?.user?.id) return null;
    return parseInt(session.user.id);
}

/**
 * Get the full session info (id + role).
 */
export async function getSessionUser(): Promise<{
    userId: number;
    role: string;
} | null> {
    const session = await auth();
    if (!session?.user?.id) return null;
    return {
        userId: parseInt(session.user.id),
        role: (session.user as { role: string }).role ?? "STUDENT",
    };
}
