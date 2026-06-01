<?php

namespace App\Support;

use App\Http\Resources\AiAnswerResource;
use App\Http\Resources\StudyNoteResource;
use App\Models\Bible\AgentRun;
use App\Models\Bible\AiAnswer;
use App\Models\Bible\Book;
use App\Models\Bible\StudyNote;
use App\Models\Bible\Verse;

class DashboardProps
{
    public static function make(): array
    {
        return [
            'stats' => [
                'books' => Book::query()->count(),
                'verses' => Verse::query()->count(),
                'notes' => StudyNote::query()->count(),
                'agentRuns' => AgentRun::query()->count(),
            ],
            'recentAnswers' => AiAnswerResource::collection(
                AiAnswer::query()
                    ->with(['question', 'agentRuns'])
                    ->latest()
                    ->limit(6)
                    ->get()
            )->resolve(),
            'recentNotes' => StudyNoteResource::collection(
                StudyNote::query()
                    ->with(['verse.translation'])
                    ->latest()
                    ->limit(6)
                    ->get()
            )->resolve(),
        ];
    }
}
