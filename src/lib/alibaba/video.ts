import { dashscopePost, pollTask } from "./client";

const VIDEO_MODEL = process.env.DASHSCOPE_VIDEO_MODEL ?? "wan2.1-i2v-turbo";

export async function submitVideoGeneration(
    imageUrl: string,
    prompt: string
): Promise<string> {
    const res = await dashscopePost(
        "/api/v1/services/aigc/video-generation/video-synthesis",
        {
            model: VIDEO_MODEL,
            input: {
                prompt,
                img_url: imageUrl,
            },
            parameters: {
                resolution: "720P",
                duration: 5,
            },
        },
        { "X-DashScope-Async": "enable" }
    );

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Video submit error: ${res.status} ${errorText}`);
    }

    const json = await res.json();
    return json.output.task_id as string;
}

export async function waitForVideo(taskId: string): Promise<string> {
    const result = await pollTask(taskId, 5000, 600000);
    const videoUrl = result.video_url;
    if (!videoUrl) {
        throw new Error(`No video URL in task result: ${JSON.stringify(result)}`);
    }
    return videoUrl as string;
}
