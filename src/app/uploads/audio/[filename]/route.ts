import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;
    const filePath = path.join(process.cwd(), "public", "uploads", "audio", filename);

    try {
        if (!fs.existsSync(filePath)) {
            return new NextResponse("File not found", { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);

        const ext = path.extname(filename).toLowerCase();
        const contentType =
            ext === ".wav" ? "audio/wav" :
                ext === ".ogg" ? "audio/ogg" :
                    "audio/mpeg";

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400",
            },
        });
    } catch (error) {
        console.error("Error serving audio:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
