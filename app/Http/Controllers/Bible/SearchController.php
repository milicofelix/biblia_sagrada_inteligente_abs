<?php

namespace App\Http\Controllers\Bible;

use App\Http\Controllers\Controller;
use App\Models\Bible\AgentRun;
use App\Models\Bible\Book;
use App\Models\Bible\StudyNote;
use App\Models\Bible\Verse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $term = trim((string) $request->query('q', ''));
        $results = [];

        if ($term !== '') {
            $results = Verse::query()
                ->with(['translation:id,abbreviation', 'book:id,name'])
                ->search($term)
                ->limit(8)
                ->get()
                ->map(fn (Verse $verse): array => [
                    'id' => $verse->id,
                    'reference' => $verse->reference,
                    'text' => $verse->text,
                    'translation' => $verse->translation?->abbreviation,
                    'book' => $verse->book?->name,
                ])
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
        ]);
    }
}
