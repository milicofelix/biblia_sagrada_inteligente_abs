<?php

namespace App\Services\Bible;

use App\Models\Bible\Verse;
use App\Services\Bible\References\BiblePassageLookup;
use App\Services\Bible\References\BibleReferenceParser;
use Illuminate\Support\Collection;

class BibleContextResolver
{
    public function __construct(
        private readonly BibleReferenceParser $parser,
        private readonly BiblePassageLookup $lookup,
    ) {}

    /**
     * @return Collection<int, Verse>
     */
    public function resolve(string $question, int $limit = 10): Collection
    {
        $verses = collect();

        foreach ($this->parser->extract($question) as $reference) {
            $verses = $verses->merge($this->lookup->searchReference($reference, $limit));
        }

        $remaining = max(0, $limit - $verses->unique('id')->count());
        $searchTerm = $this->parser->stripReferences($question) ?: $question;

        if ($remaining > 0) {
            $verses = $verses->merge($this->searchTheme($searchTerm, $remaining));
        }

        $verses = $verses
            ->unique('id')
            ->values();

        if ($verses->isNotEmpty()) {
            return $verses;
        }

        return Verse::query()
            ->with(['translation:id,abbreviation'])
            ->latest('id')
            ->limit($limit)
            ->get();
    }

    /**
     * @return Collection<int, Verse>
     */
    private function searchTheme(string $term, int $limit): Collection
    {
        $results = Verse::query()
            ->with(['translation:id,abbreviation'])
            ->search($term)
            ->limit($limit)
            ->get();

        if ($results->isNotEmpty()) {
            return $results;
        }

        $keywords = collect(preg_split('/\s+/u', mb_strtolower($term)) ?: [])
            ->map(fn (string $word): string => trim($word, ".,;:!?()[]{}\"'"))
            ->reject(fn (string $word): bool => mb_strlen($word) < 4)
            ->reject(fn (string $word): bool => in_array($word, ['explique', 'conecte', 'sobre', 'forma', 'breve', 'algo', 'existe'], true))
            ->unique()
            ->values();

        foreach ($keywords as $keyword) {
            $results = $results->merge(
                Verse::query()
                    ->with(['translation:id,abbreviation'])
                    ->search($keyword)
                    ->limit($limit - $results->unique('id')->count())
                    ->get()
            )->unique('id')->values();

            if ($results->count() >= $limit) {
                break;
            }
        }

        return $results->take($limit);
    }
}
