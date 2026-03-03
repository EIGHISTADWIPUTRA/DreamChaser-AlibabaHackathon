export type SectionType = "title" | "orientation" | "complication" | "resolution" | "reorientation";

export interface SectionData {
    id: number;
    storyId: number;
    sectionType: SectionType;
    textContent: string;
    isLocked: boolean;
    imagePromptBrief: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    audioUrl: string | null;
    isIllustrated: boolean;
    sortOrder: number;
}

export interface StoryRecord {
    id: number;
    userId: number;
    title: string;
    status: "drafting" | "illustrating" | "finalizing" | "completed";
    artStyle?: string;
    createdAt: string;
    sections?: SectionData[];
}

export interface AIFeedback {
    feedback: string;
    suggestions?: string[];
}

export const SECTION_ORDER: {
    type: SectionType;
    label: string;
    description: string;
    sortOrder: number;
}[] = [
    {
        type: "title",
        label: "Title",
        description: "The title of your narrative story",
        sortOrder: 1,
    },
    {
        type: "orientation",
        label: "Orientation",
        description: "Introduce the characters, setting, and time",
        sortOrder: 2,
    },
    {
        type: "complication",
        label: "Complication",
        description: "The problem or conflict that arises",
        sortOrder: 3,
    },
    {
        type: "resolution",
        label: "Resolution",
        description: "How the problem is solved",
        sortOrder: 4,
    },
    {
        type: "reorientation",
        label: "Reorientation",
        description: "The ending and moral of the story",
        sortOrder: 5,
    },
];

// Illustration order: body sections first, cover/title last
export const ILLUSTRATION_ORDER: SectionType[] = [
    "orientation",
    "complication",
    "resolution",
    "reorientation",
    "title",
];
