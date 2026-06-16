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
use App\Models\Bible\WorshipJournalEntry;
use App\Models\User;
use App\Services\Bible\DailyVerseResolver;
use App\Services\Bible\ReadingPlanBootstrapper;
use App\Services\UserSettingsResolver;

class DashboardProps
{
    public static function make(User $user): array
    {
        $settings = app(UserSettingsResolver::class)->forUser($user);
        $translationId = app(UserSettingsResolver::class)->preferredTranslationId($settings);

        return [
            'settings' => [
                'theme' => $settings->theme,
                'notificationsEnabled' => $settings->notifications_enabled,
            ],
            'stats' => [
                'books' => Book::query()->count(),
                'verses' => Verse::query()->count(),
                'notes' => StudyNote::query()->whereBelongsTo($user)->count(),
                'favorites' => VerseFavorite::query()->whereBelongsTo($user)->count(),
                'agentRuns' => AgentRun::query()
                    ->whereHas('answer.question', fn ($query) => $query->whereBelongsTo($user))
                    ->count(),
                'worshipJournalEntries' => WorshipJournalEntry::query()->whereBelongsTo($user)->count(),
            ],
            'activeReadingPlan' => ($plan = app(ReadingPlanBootstrapper::class)->defaultNewTestamentPlan($user))
                ? ReadingPlanResource::make($plan)->resolve()
                : null,
            'dailyVerse' => ($dailyVerse = app(DailyVerseResolver::class)->forDate(translationId: $translationId))
                ? DailyVerseResource::make($dailyVerse)->resolve()
                : null,
            'recentFavorites' => VerseFavoriteResource::collection(
                VerseFavorite::query()
                    ->whereBelongsTo($user)
                    ->with(['verse.translation'])
                    ->latest()
                    ->limit(6)
                    ->get()
            )->resolve(),
            'recentAnswers' => AiAnswerResource::collection(
                AiAnswer::query()
                    ->whereHas('question', fn ($query) => $query->whereBelongsTo($user))
                    ->with(['question', 'agentRuns'])
                    ->latest()
                    ->limit(6)
                    ->get()
            )->resolve(),
            'recentNotes' => StudyNoteResource::collection(
                StudyNote::query()
                    ->whereBelongsTo($user)
                    ->with(['verse.translation'])
                    ->latest()
                    ->limit(6)
                    ->get()
            )->resolve(),
        ];
    }
}
