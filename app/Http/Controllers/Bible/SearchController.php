<?php

namespace App\Http\Controllers\Bible;

use App\Http\Controllers\Controller;
use App\Models\Bible\StudyNote;
use App\Models\Bible\Verse;
use App\Services\Bible\References\BiblePassageLookup;
use App\Support\DashboardProps;
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
                ->load(['notes', 'favorites'])
                ->map(fn (Verse $verse): array => $this->serializeVerse($verse))
                ->all();
        }

        return Inertia::render('Dashboard', [
            'initialReference' => $term ?: 'Joao 3:16',
            'search' => [
                'term' => $term,
                'results' => $results,
            ],
            ...DashboardProps::make(),
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
            'isFavorited' => $verse->favorites->isNotEmpty(),
            'latestNote' => $verse->notes
                ->sortByDesc('created_at')
                ->map(fn (StudyNote $note): array => [
                    'id' => $note->id,
                    'title' => $note->title,
                    'body' => $note->body,
                    'createdAt' => $note->created_at?->toISOString(),
                ])
                ->first(),
        ];
    }
}
