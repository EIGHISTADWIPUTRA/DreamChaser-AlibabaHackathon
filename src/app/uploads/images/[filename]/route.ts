import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;

    // Construct the absolute path to where the file physically lives
    const filePath = path.join(process.cwd(), "public", "uploads", "images", filename);

    try {
        // Check if the file exists on the disk
        if (!fs.existsSync(filePath)) {
            return new NextResponse("File not found", { status: 404 });
        }

        // Read the file
        const fileBuffer = fs.readFileSync(filePath);

        // Determine the content type
        const ext = path.extname(filename).toLowerCase();
        const contentType =
            ext === ".jpg" || ext === ".jpeg"
                ? "image/jpeg"
                : ext === ".webp"
                    ? "image/webp"
                    : "image/png";

        // Return the file as a valid image response with caching
        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400",
            },
        });
    } catch (error) {
        console.error("Error serving image:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
