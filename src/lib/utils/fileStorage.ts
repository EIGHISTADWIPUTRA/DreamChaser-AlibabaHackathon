import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_BASE = path.join(process.cwd(), "public", "uploads");

export async function downloadAndSave(
    remoteUrl: string,
    subDir: string,
    filename: string
): Promise<string> {
    const dir = path.join(UPLOAD_BASE, subDir);
    await mkdir(dir, { recursive: true });

    const filePath = path.join(dir, filename);
    const res = await fetch(remoteUrl);

    if (!res.ok) {
        throw new Error(`Download failed: ${res.status} ${res.statusText}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(filePath, buffer);

    return `/uploads/${subDir}/${filename}`;
}

export async function saveBuffer(
    data: Buffer,
    subDir: string,
    filename: string
): Promise<string> {
    const dir = path.join(UPLOAD_BASE, subDir);
    await mkdir(dir, { recursive: true });

    const filePath = path.join(dir, filename);
    await writeFile(filePath, data);

    return `/uploads/${subDir}/${filename}`;
}
