import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { generateJSON } from "@/lib/alibaba/text";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
    try {
        const sessionUser = await getSessionUser();
        if (!sessionUser) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        if (sessionUser.role !== "TEACHER") {
            return NextResponse.json({ error: "Only teachers can evaluate" }, { status: 403 });
        }

        const { storyId } = await request.json();
        const storyIdNum = parseInt(storyId);

        const story = await prisma.story.findFirst({
            where: { id: storyIdNum },
            include: { sections: { orderBy: { sortOrder: "asc" } } },
        });

        if (!story) {
            return NextResponse.json({ error: "Story not found" }, { status: 404 });
        }

        // Check if AI evaluation already exists
        if (story.aiGradingSuggestion) {
            return NextResponse.json({
                evaluation: JSON.parse(story.aiGradingSuggestion),
                cached: true,
            });
        }

        // Build story text for evaluation
        const storyText = story.sections
            .filter((s) => s.sectionType !== "title" && s.textContent)
            .map((s) => `[${s.sectionType.toUpperCase()}]\n${s.textContent}`)
            .join("\n\n");

        const system = `You are an experienced English Teacher evaluating a student's Narrative Text. 
Analyze the story and provide a structured evaluation.

Evaluate based on these criteria:
1. **Structure (0-30)**: Does the text follow the correct Narrative Text structure? 
   - Orientation: Introduces characters, setting, and time.
   - Complication: Presents a clear conflict or problem.
   - Resolution: Shows how the problem is solved.
   - Reorientation: Wraps up the story with a closing.

2. **Language Features (0-30)**: Does the text use appropriate language features?
   - Past tense usage
   - Action verbs
   - Temporal connectives (then, after that, finally)
   - Direct/indirect speech
   - Descriptive language

3. **Creativity & Coherence (0-40)**: Is the story creative, engaging, and coherent?
   - Original plot and characters
   - Engaging narrative voice
   - Logical flow between sections
   - Emotional impact

Respond ONLY with a JSON object (no markdown) with this exact structure:
{
  "suggestedGrade": <number 0-100>,
  "structure": { "score": <0-30>, "feedback": "<specific feedback>" },
  "language": { "score": <0-30>, "feedback": "<specific feedback>" },
  "creativity": { "score": <0-40>, "feedback": "<specific feedback>" },
  "overallFeedback": "<2-3 sentences of encouraging overall feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}`;

        const user = `Story Title: "${story.title}"

${storyText}

Please evaluate this Narrative Text.`;

        const evaluation = await generateJSON(
            [{ role: "user", content: user }],
            system
        );

        // Save to DB
        await prisma.story.update({
            where: { id: storyIdNum },
            data: { aiGradingSuggestion: JSON.stringify(evaluation) },
        });

        return NextResponse.json({ evaluation, cached: false });
    } catch (error) {
        console.error("AI evaluation error:", error);
        return NextResponse.json(
            { error: "Failed to evaluate: " + (error as Error).message },
            { status: 500 }
        );
    }
}
