import type { SectionType } from "@/types";

// ── Structure Check Prompt ──────────────────────────────
export function buildStructureCheckPrompt(
    sectionType: SectionType,
    currentText: string,
    previousSections: { type: SectionType; text: string }[]
): { system: string; user: string } {
    const contextBlock = previousSections
        .map((s) => `[${s.type.toUpperCase()}]\n${s.text}`)
        .join("\n\n");

    const system = `You are an English teacher evaluating a student's Narrative Text writing.
Your ONLY job is to check whether the student's text structurally matches the "${sectionType}" section of a narrative.

Narrative structure reference:
- Title: A concise, engaging title for the story.
- Orientation: Introduces who (characters), where (setting), and when (time). Sets the scene.
- Complication: Presents the conflict, problem, or challenge the characters face.
- Resolution: Shows how the problem is solved or the conflict ends.
- Reorientation: The closing — reflects on the outcome, states a moral, or wraps up loose ends.

RULES:
1. Do NOT rewrite the student's text. You are a guide, not a ghostwriter.
2. Point out if the text belongs to a different section (e.g., jumps to complication in the orientation).
3. Suggest what structural elements are missing or out of place.
4. Be encouraging but honest. Use simple, clear English.
5. Respond in a JSON object with "feedback" (string) and "suggestions" (array of strings).`;

    const user = `Here is the story so far:
${contextBlock ? contextBlock + "\n\n" : ""}Current section being evaluated: [${sectionType.toUpperCase()}]
${currentText}

Please evaluate whether this text correctly matches the "${sectionType}" section of a narrative text.`;

    return { system, user };
}

// ── Grammar Check Prompt ────────────────────────────────
export function buildGrammarCheckPrompt(text: string): {
    system: string;
    user: string;
} {
    const system = `You are an English grammar tutor helping a student improve their writing.

RULES:
1. Identify grammar errors, spelling mistakes, and awkward phrasing.
2. Explain each error clearly and provide the corrected version.
3. Do NOT rewrite the entire text. Focus on specific corrections.
4. Be encouraging and educational.
5. Respond in a JSON object with "feedback" (string, overall assessment) and "suggestions" (array of strings, each a specific correction).`;

    const user = `Please check the grammar of this text:

${text}`;

    return { system, user };
}

// ── Brainstorm Prompt ───────────────────────────────────
export function buildBrainstormPrompt(
    sectionType: SectionType,
    previousSections: { type: SectionType; text: string }[]
): { system: string; user: string } {
    const contextBlock = previousSections
        .map((s) => `[${s.type.toUpperCase()}]\n${s.text}`)
        .join("\n\n");

    const system = `You are a creative writing tutor helping a student brainstorm ideas for their Narrative Text.

Your job is to provide guiding questions and creative suggestions to help the student figure out what to write for the "${sectionType}" section — do NOT write the story for them.

RULES:
1. Ask thought-provoking questions (e.g., "What if your character discovers something unexpected?").
2. Suggest possible directions without dictating the story.
3. Make sure suggestions are consistent with what has already been written.
4. Be enthusiastic and inspiring!
5. Respond in a JSON object with "feedback" (string, general encouragement) and "suggestions" (array of 3-5 guiding questions or ideas).`;

    const user = `Story context so far:
${contextBlock ? contextBlock : "(No previous sections yet)"}

The student needs ideas for the [${sectionType.toUpperCase()}] section. Please provide creative guiding questions and suggestions.`;

    return { system, user };
}

// ── Illustration Brief Prompt (Tag-Based for Character Consistency, Ghost Character Fix) ──
export function buildIllustrationBriefPrompt(
    sectionType: SectionType,
    sectionText: string,
    previousBriefs: string
): { system: string; user: string } {
    const system = `You are a technical Art Director creating highly structured illustration prompts for an AI image generator.

    CRITICAL RULES:
    1. Always output exactly these 5 tags in order: [Characters in Scene], [Character Details], [Setting], [Time], [Action].
    2. [Characters in Scene]: A simple comma-separated list of the names or roles of characters ACTIVELY PRESENT in the current 'Text'. 
       - TRANSFORMATIONS: If a character transforms (e.g., monkey to prince), list ONLY the new form. DO NOT list the old form.
       - If a character leaves the scene, DO NOT list them.
    3. [Character Details]: Describe physical traits and clothing perfectly ONLY for the characters listed in [Characters in Scene].
       - If 'Previous Characters' are provided, COPY their exact descriptions ONLY if they are currently in the scene.
       - DO NOT describe characters from previous scenes if they are no longer present or have transformed.
    4. Keep descriptions punchy and comma-separated.
    5. Do NOT mention any art style.

    OUTPUT FORMAT:
    [Characters in Scene]: (List of names only, e.g., Prince Guruminda, Purbasari)
    [Character Details]: (Subject 1 details), (Subject 2 details)
    [Setting]: (Location details)
    [Time]: (Lighting and time of day)
    [Action]: (What is happening, poses)

    FEW-SHOT EXAMPLE:
    User Input -> Text: "The magical black monkey suddenly transformed into the handsome Prince Guruminda." Previous Characters: "Monkey: A magical black monkey, Purbasari: A beautiful princess."
    Output ->
    [Characters in Scene]: Prince Guruminda
    [Character Details]: Prince Guruminda: A handsome majestic prince wearing a golden crown and elegant royal clothes
    [Setting]: A magical forest clearing
    [Time]: Daytime, bright magical light
    [Action]: The prince is standing proudly, glowing with magical transformation energy
    `;

    const user = `
    Section: ${sectionType}
    Text: "${sectionText}"
    Previous Characters: ${previousBriefs || "None."}
    
    Generate the structured visual prompt:`;

    return { system, user };
}

// ── Brief Revision Prompt (Tag-Based) ───────────────────
export function buildBriefRevisionPrompt(
    currentBrief: string,
    userFeedback: string
): { system: string; user: string } {
    const system = `You are a technical Art Director revising an illustration brief based on user feedback.
You MUST keep the exact same tagged format: [Characters in Scene], [Character Details], [Setting], [Time], [Action].
Incorporate the user's requested changes while preserving character descriptions exactly unless specifically asked to change them.
Respond with ONLY the revised tagged prompt, nothing else.`;

    const user = `Current brief:
${currentBrief}

User's revision request: ${userFeedback}

Generate the revised structured visual prompt:`;

    return { system, user };
}

// ── Cover Brief Prompt (Tag-Based, Title — generated last) ──
export function buildCoverBriefPrompt(
    title: string,
    fullStoryText: string,
    previousBriefs: string
): { system: string; user: string } {
    const system = `You are a technical Art Director creating a BOOK COVER illustration prompt for an AI image generator.
The cover must visually represent the entire story and be eye-catching.
You MUST output a strict tagged format for character consistency with interior illustrations.

CRITICAL RULES:
1. Always output exactly these 5 tags in order: [Characters in Scene], [Character Details], [Setting], [Time], [Action].
2. [Characters in Scene]: A comma-separated list of the main characters to feature on the cover.
3. [Character Details]: YOU MUST COPY AND PASTE the exact character descriptions from 'Previous Characters'. Do not alter their design. Only include characters listed in [Characters in Scene].
4. Keep descriptions punchy and comma-separated.
5. Do NOT mention any art style (e.g., watercolor, 3D).
6. NO text should appear in the illustration (title will be overlaid later).
7. The composition should be bold and engaging — suitable for a front cover.

OUTPUT FORMAT:
[Characters in Scene]: (List of names only)
[Character Details]: (Subject details — copy from previous)
[Setting]: (Iconic location from the story)
[Time]: (Lighting and time of day)
[Action]: (A dynamic, eye-catching hero pose or key moment)
`;

    const user = `Book title: "${title}"

Full story:
${fullStoryText}

Previous Characters: ${previousBriefs || "None."}

Generate the structured cover visual prompt:`;

    return { system, user };
}

// ── Video Animation Prompt (Cinematic Motion — Style-Aware, 2 styles) ──────
export function buildVideoAnimationPrompt(sectionType: string, requestedStyle: string = ""): string {
    const isPhoto = requestedStyle.toLowerCase().includes("photorealism");

    const motionStyle = isPhoto
        ? "Cinematic live-action motion. Hyper-realistic, natural human/animal micro-movements, breathing, and subtle real-world physics."
        : "Smooth 3D animation motion. Fluid character movements, cinematic 3D camera pan, soft realistic physics.";

    return `${motionStyle} Context: ${sectionType} scene. Highly stable scene, no morphing, preserve the exact art style and character details of the input image perfectly.`;
}
