import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const { username, password, role } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: "Username and password are required" },
                { status: 400 }
            );
        }

        if (username.length < 3 || username.length > 30) {
            return NextResponse.json(
                { error: "Username must be 3-30 characters" },
                { status: 400 }
            );
        }

        if (password.length < 4) {
            return NextResponse.json(
                { error: "Password must be at least 4 characters" },
                { status: 400 }
            );
        }

        const validRoles = ["STUDENT", "TEACHER"];
        const userRole = validRoles.includes(role) ? role : "STUDENT";

        // Check if user exists
        const existing = await prisma.user.findUnique({
            where: { username },
        });
        if (existing) {
            return NextResponse.json(
                { error: "Username already taken" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: userRole,
            },
        });

        return NextResponse.json({
            user: { id: user.id, username: user.username, role: user.role },
        });
    } catch (error) {
        console.error("Register error:", error);
        return NextResponse.json(
            { error: "Registration failed" },
            { status: 500 }
        );
    }
}
