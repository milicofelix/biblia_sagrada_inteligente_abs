<?php

namespace App\Http\Controllers\Bible;

use App\Http\Controllers\Controller;
use App\Http\Resources\AiAnswerResource;
use App\Models\Bible\AgentRun;
use App\Models\Bible\AiAnswer;
use App\Models\Bible\Book;
use App\Models\Bible\StudyNote;
use App\Models\Bible\Verse;
use App\Services\Bible\References\BiblePassageLookup;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    public function __invoke(Request $request, BiblePassageLookup $passageLookup): Response
    {
        $term = trim((string) $request->query('q', ''));
        $results = [];

        if ($term !== '') {
            $verses = $passageLookup->search($term, 80);

            if ($verses->isEmpty()) {
                $verses = Verse::query()
                    ->with(['translation:id,abbreviation', 'book:id,name'])
                    ->search($term)
                    ->limit(8)
                    ->get();
            }

            $results = $verses
                ->map(fn (Verse $verse): array => $this->serializeVerse($verse))
                ->all();
        }

        return Inertia::render('Dashboard', [
            'initialReference' => $term ?: 'Joao 3:16',
            'search' => [
                'term' => $term,
                'results' => $results,
            ],
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
        ]);
    }

    private function serializeVerse(Verse $verse): array
    {
        return [
            'id' => $verse->id,
            'reference' => $verse->reference,
            'text' => $verse->text,
            'translation' => $verse->translation?->abbreviation,
            'book' => $verse->book?->name,
        ];
    }
}
