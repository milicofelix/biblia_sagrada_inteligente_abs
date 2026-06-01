<?php

namespace App\Services\Bible\References;

use App\Models\Bible\Verse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class BiblePassageLookup
{
    public function __construct(private readonly BibleReferenceParser $parser) {}

    /**
     * @return Collection<int, Verse>
     */
    public function search(string $value, int $limit = 80): Collection
    {
        $reference = $this->parser->parse($value);

        if (! $reference) {
            return collect();
        }

        return $this->searchReference($reference, $limit);
    }

    /**
     * @return Collection<int, Verse>
     */
    public function searchReference(ParsedBibleReference $reference, int $limit = 80): Collection
    {
        return $this->queryReference($reference)
            ->orderBy('chapter_number')
            ->orderBy('verse_number')
            ->limit($limit)
            ->get();
    }

    private function queryReference(ParsedBibleReference $reference): Builder
    {
        return Verse::query()
            ->with(['translation:id,abbreviation', 'book:id,name,testament,position'])
            ->where('book_id', $reference->book->id)
            ->where(function (Builder $query) use ($reference): void {
                if ($reference->isChapterOnly()) {
                    $query->where('chapter_number', $reference->chapter);

                    return;
                }

                $query->where(function (Builder $query) use ($reference): void {
                    $query->where('chapter_number', $reference->chapter)
                        ->where('verse_number', '>=', $reference->startVerse);

                    if ($reference->finalChapter() === $reference->chapter && $reference->finalVerse() !== null) {
                        $query->where('verse_number', '<=', $reference->finalVerse());
                    }
                });

                if ($reference->finalChapter() > $reference->chapter) {
                    $query->orWhere(function (Builder $query) use ($reference): void {
                        $query->whereBetween('chapter_number', [$reference->chapter + 1, $reference->finalChapter() - 1]);
                    });

                    $query->orWhere(function (Builder $query) use ($reference): void {
                        $query->where('chapter_number', $reference->finalChapter())
                            ->where('verse_number', '<=', $reference->finalVerse());
                    });
                }
            });
    }
}
