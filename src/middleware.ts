import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const publicRoutes = ["/", "/login", "/register", "/library"];
const publicPrefixes = ["/api/auth", "/preview/", "/api/"];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow public routes
    if (publicRoutes.includes(pathname)) return NextResponse.next();
    if (publicPrefixes.some((p) => pathname.startsWith(p))) return NextResponse.next();

    // Allow static files
    if (pathname.startsWith("/_next") || pathname.startsWith("/uploads") || pathname.includes(".")) {
        return NextResponse.next();
    }

    // Check for NextAuth session cookie (works in Edge runtime)
    const sessionToken =
        req.cookies.get("authjs.session-token")?.value ||
        req.cookies.get("__Secure-authjs.session-token")?.value;

    // Not authenticated → login
    if (!sessionToken) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // For role-based routing, we can't decode JWT in Edge without crypto imports.
    // Role checks will be handled by the pages/APIs themselves.
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
