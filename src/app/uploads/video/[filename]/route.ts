import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

// Convert Node.js ReadableStream to Web ReadableStream
function nodeStreamToWeb(nodeStream: Readable): ReadableStream<Uint8Array> {
    return new ReadableStream({
        start(controller) {
            nodeStream.on("data", (chunk: Buffer) => {
                controller.enqueue(new Uint8Array(chunk));
            });
            nodeStream.on("end", () => {
                controller.close();
            });
            nodeStream.on("error", (err) => {
                controller.error(err);
            });
        },
        cancel() {
            nodeStream.destroy();
        },
    });
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;
    const filePath = path.join(process.cwd(), "public", "uploads", "video", filename);

    if (!fs.existsSync(filePath)) {
        return new NextResponse("Video not found", { status: 404 });
    }

    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const range = request.headers.get("range");

    // Handle Byte-Range Requests for streaming playback
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        const nodeStream = fs.createReadStream(filePath, { start, end });
        const webStream = nodeStreamToWeb(nodeStream);

        return new NextResponse(webStream, {
            status: 206,
            headers: {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunkSize.toString(),
                "Content-Type": "video/mp4",
            },
        });
    } else {
        const nodeStream = fs.createReadStream(filePath);
        const webStream = nodeStreamToWeb(nodeStream);

        return new NextResponse(webStream, {
            status: 200,
            headers: {
                "Content-Length": fileSize.toString(),
                "Content-Type": "video/mp4",
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=86400",
            },
        });
    }
}
