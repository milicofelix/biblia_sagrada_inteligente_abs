<?php

namespace App\Services\Bible;

use App\Models\Bible\Book;
use App\Models\Bible\ReadingPlan;
use App\Models\Bible\ReadingPlanDay;
use App\Models\Bible\Verse;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReadingPlanBootstrapper
{
    public const DEFAULT_SLUG = 'novo-testamento-90-dias';

    public function defaultNewTestamentPlan(User $user): ?ReadingPlan
    {
        $plan = ReadingPlan::query()
            ->whereBelongsTo($user)
            ->where('slug', self::DEFAULT_SLUG)
            ->first();

        if ($plan && $plan->days()->exists()) {
            return $plan->load(['days' => fn ($query) => $query->orderBy('day_number')]);
        }

        if (Verse::query()->count() === 0) {
            return null;
        }

        return DB::transaction(function () use ($plan, $user): ?ReadingPlan {
            $chapters = $this->newTestamentChapters();

            if ($chapters->isEmpty()) {
                return null;
            }

            $plan ??= ReadingPlan::query()->create([
                'user_id' => $user->id,
                'name' => 'Novo Testamento em 90 dias',
                'slug' => self::DEFAULT_SLUG,
                'description' => 'Leitura progressiva do Novo Testamento para criar ritmo devocional diario.',
                'days_count' => 90,
            ]);

            $plan->days()->delete();

            $totalChapters = $chapters->count();
            $totalDays = min(90, $totalChapters);

            for ($day = 1; $day <= $totalDays; $day++) {
                $startIndex = (int) floor((($day - 1) * $totalChapters) / $totalDays);
                $endIndex = (int) floor(($day * $totalChapters) / $totalDays) - 1;
                $chunk = $chapters->slice($startIndex, $endIndex - $startIndex + 1)->values();
                $first = $chunk->first();
                $last = $chunk->last();

                ReadingPlanDay::query()->create([
                    'reading_plan_id' => $plan->id,
                    'day_number' => $day,
                    'title' => "Dia {$day}",
                    'reference' => $this->referenceFor($first, $last),
                    'start_verse_id' => $first['start_verse_id'],
                    'end_verse_id' => $last['end_verse_id'],
                ]);
            }

            return $plan->fresh(['days' => fn ($query) => $query->orderBy('day_number')]);
        });
    }

    private function newTestamentChapters(): Collection
    {
        return Book::query()
            ->where('testament', 'new')
            ->orderBy('position')
            ->get()
            ->flatMap(function (Book $book): array {
                $chapters = [];

                for ($chapter = 1; $chapter <= $book->chapters_count; $chapter++) {
                    $verses = Verse::query()
                        ->where('book_id', $book->id)
                        ->where('chapter_number', $chapter)
                        ->orderBy('verse_number')
                        ->get(['id', 'verse_number']);

                    if ($verses->isEmpty()) {
                        continue;
                    }

                    $chapters[] = [
                        'book' => $book->name,
                        'chapter' => $chapter,
                        'start_verse_id' => $verses->first()->id,
                        'end_verse_id' => $verses->last()->id,
                    ];
                }

                return $chapters;
            })
            ->values();
    }

    private function referenceFor(array $first, array $last): string
    {
        if ($first['book'] === $last['book'] && $first['chapter'] === $last['chapter']) {
            return "{$first['book']} {$first['chapter']}";
        }

        if ($first['book'] === $last['book']) {
            return "{$first['book']} {$first['chapter']}-{$last['chapter']}";
        }

        return "{$first['book']} {$first['chapter']} - {$last['book']} {$last['chapter']}";
    }
}
