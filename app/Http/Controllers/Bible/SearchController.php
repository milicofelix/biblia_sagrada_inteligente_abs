<?php

namespace App\Http\Controllers\Bible;

use App\Http\Controllers\Controller;
use App\Models\Bible\CrossReference;
use App\Models\Bible\StudyNote;
use App\Models\Bible\Verse;
use App\Services\Bible\BiblicalTimelineResolver;
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
                    ->with(['translation:id,abbreviation', 'book:id,name,testament,position'])
                    ->search($term)
                    ->limit(8)
                    ->get();
            }

            $results = $verses
                ->load([
                    'notes',
                    'favorites',
                    'outgoingCrossReferences.targetVerse.translation',
                    'incomingCrossReferences.sourceVerse.translation',
                ])
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
            'crossReferences' => $this->serializeCrossReferences($verse),
            'timeline' => app(BiblicalTimelineResolver::class)->forVerse($verse),
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

    private function serializeCrossReferences(Verse $verse): array
    {
        $outgoing = $verse->outgoingCrossReferences
            ->map(fn (CrossReference $reference): array => $this->serializeCrossReference(
                reference: $reference,
                relatedVerse: $reference->targetVerse,
                direction: 'outgoing',
            ));

        $incoming = $verse->incomingCrossReferences
            ->map(fn (CrossReference $reference): array => $this->serializeCrossReference(
                reference: $reference,
                relatedVerse: $reference->sourceVerse,
                direction: 'incoming',
            ));

        return $outgoing
            ->toBase()
            ->merge($incoming->toBase())
            ->filter(fn (array $reference): bool => filled($reference['reference']))
            ->unique('verseId')
            ->take(8)
            ->values()
            ->all();
    }

    private function serializeCrossReference(CrossReference $reference, ?Verse $relatedVerse, string $direction): array
    {
        return [
            'id' => $reference->id,
            'verseId' => $relatedVerse?->id,
            'reference' => $relatedVerse?->reference,
            'text' => $relatedVerse?->text,
            'translation' => $relatedVerse?->translation?->abbreviation,
            'relationship' => $reference->relationship,
            'notes' => $reference->notes,
            'direction' => $direction,
        ];
    }
}
