import type { LucideIcon } from 'lucide-react';

export type DashboardStats = {
    books?: number;
    verses?: number;
    notes?: number;
    agentRuns?: number;
};

export type VerseResultData = {
    id: number;
    reference: string;
    text: string;
    translation?: string | null;
    book?: string | null;
    latestNote?: StudyNote | null;
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
