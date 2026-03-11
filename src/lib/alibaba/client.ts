const BASE_URL =
    process.env.DASHSCOPE_BASE_URL ?? "https://dashscope-intl.aliyuncs.com";
const API_KEY = () => process.env.DASHSCOPE_API_KEY ?? "";

export async function dashscopePost(
    path: string,
    body: Record<string, unknown>,
    extraHeaders?: Record<string, string>
): Promise<Response> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout

            const res = await fetch(`${BASE_URL}${path}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${API_KEY()}`,
                    ...extraHeaders,
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            return res;
        } catch (err) {
            lastError = err as Error;
            console.warn(`DashScope POST attempt ${attempt}/${maxRetries} failed:`, (err as Error).message);
            if (attempt < maxRetries) {
                await new Promise((r) => setTimeout(r, 2000 * attempt)); // backoff
            }
        }
    }
    throw lastError!;
}

export async function dashscopeGet(path: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout

    const res = await fetch(`${BASE_URL}${path}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${API_KEY()}`,
        },
        signal: controller.signal,
    });
    clearTimeout(timeout);
    return res;
}

interface TaskResult {
    task_id: string;
    task_status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "UNKNOWN";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

/**
 * Check a task's current status once without polling.
 */
export async function checkTask(taskId: string): Promise<TaskResult> {
    const res = await dashscopeGet(`/api/v1/tasks/${taskId}`);
    if (!res.ok) {
        throw new Error(`Check task failed: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    return json.output as TaskResult;
}

export async function pollTask(
    taskId: string,
    intervalMs = 3000,
    timeoutMs = 600000
): Promise<TaskResult> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        const res = await dashscopeGet(`/api/v1/tasks/${taskId}`);
        if (!res.ok) {
            throw new Error(`Poll task failed: ${res.status} ${res.statusText}`);
        }
        const json = await res.json();
        const output: TaskResult = json.output;

        if (output.task_status === "SUCCEEDED") {
            return output;
        }
        if (output.task_status === "FAILED") {
            throw new Error(
                `Task ${taskId} failed: ${JSON.stringify(output)}`
            );
        }

        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error(`Task ${taskId} timed out after ${timeoutMs}ms`);
}
