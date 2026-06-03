<?php

namespace App\Support;

use App\Http\Resources\AiAnswerResource;
use App\Http\Resources\DailyVerseResource;
use App\Http\Resources\ReadingPlanResource;
use App\Http\Resources\StudyNoteResource;
use App\Http\Resources\VerseFavoriteResource;
use App\Models\Bible\AgentRun;
use App\Models\Bible\AiAnswer;
use App\Models\Bible\Book;
use App\Models\Bible\StudyNote;
use App\Models\Bible\Verse;
use App\Models\Bible\VerseFavorite;
use App\Services\Bible\DailyVerseResolver;
use App\Services\Bible\ReadingPlanBootstrapper;

class DashboardProps
{
    public static function make(): array
    {
        return [
            'stats' => [
                'books' => Book::query()->count(),
                'verses' => Verse::query()->count(),
                'notes' => StudyNote::query()->count(),
                'favorites' => VerseFavorite::query()->count(),
                'agentRuns' => AgentRun::query()->count(),
            ],
            'activeReadingPlan' => ($plan = app(ReadingPlanBootstrapper::class)->defaultNewTestamentPlan())
                ? ReadingPlanResource::make($plan)->resolve()
                : null,
            'dailyVerse' => ($dailyVerse = app(DailyVerseResolver::class)->forDate())
                ? DailyVerseResource::make($dailyVerse)->resolve()
                : null,
            'recentFavorites' => VerseFavoriteResource::collection(
                VerseFavorite::query()
                    ->with(['verse.translation'])
                    ->latest()
                    ->limit(6)
                    ->get()
            )->resolve(),
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
