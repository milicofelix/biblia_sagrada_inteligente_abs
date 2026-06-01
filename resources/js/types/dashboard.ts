import type { LucideIcon } from 'lucide-react';

export type DashboardStats = {
    books?: number;
    verses?: number;
    notes?: number;
    favorites?: number;
    agentRuns?: number;
};

export type VerseResultData = {
    id: number;
    reference: string;
    text: string;
    translation?: string | null;
    book?: string | null;
    isFavorited?: boolean;
    latestNote?: StudyNote | null;
};

export type VerseFavorite = {
    id: number;
    verseId: number;
    reference?: string | null;
    text?: string | null;
    translation?: string | null;
    createdAt?: string | null;
};

export type ReadingPlanDay = {
    id: number;
    dayNumber: number;
    title: string;
    reference: string;
    completedAt?: string | null;
};

export type ReadingPlan = {
    id: number;
    name: string;
    description?: string | null;
    daysCount: number;
    completedDays: number;
    progressPercent: number;
    currentDay?: ReadingPlanDay | null;
};

export type StudyNote = {
    id: number;
    verseId?: number;
    reference?: string | null;
    translation?: string | null;
    title?: string | null;
    body: string;
    createdAt?: string | null;
};

export type AgentStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | string;

export type AiAgentRun = {
    agent: string;
    title: string;
    status: AgentStatus;
};

export type AiSection = {
    agent: string;
    title?: string;
    text?: string;
    status?: AgentStatus;
};

export type Citation = {
    reference: string;
    translation?: string | null;
};

export type AiAnswer = {
    id: number;
    question?: string;
    status?: AgentStatus;
    error?: string | null;
    sections?: AiSection[];
    agents?: AiAgentRun[];
    citations?: Citation[];
    createdAt?: string | null;
};

export type DashboardSearch = {
    term?: string;
    results?: VerseResultData[];
};

export type DashboardProps = {
    initialReference?: string;
    search?: DashboardSearch;
    stats?: DashboardStats;
    recentAnswers?: AiAnswer[];
    recentNotes?: StudyNote[];
    recentFavorites?: VerseFavorite[];
    activeReadingPlan?: ReadingPlan | null;
};

export type NavigationItem = {
    label: string;
    icon: LucideIcon;
    active: boolean;
};

export type AudioItem = {
    reference?: string;
    text?: string;
};

export type PodcastEpisode = {
    title: string;
    reference: string;
    description: string;
    durationLabel: string;
    items: AudioItem[];
    script: string;
    preview: string[];
};
