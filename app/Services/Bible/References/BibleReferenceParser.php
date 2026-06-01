<?php

namespace App\Services\Bible\References;

use App\Models\Bible\Book;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class BibleReferenceParser
{
    /**
     * @var Collection<int, Book>|null
     */
    private ?Collection $books = null;

    public function parse(string $value): ?ParsedBibleReference
    {
        $value = trim(preg_replace('/\s+/', ' ', $value) ?? '');

        if (! preg_match($this->referencePattern(anchored: true), $value, $matches)) {
            return null;
        }

        return $this->fromMatches($matches);
    }

    /**
     * @return array<int, ParsedBibleReference>
     */
    public function extract(string $value): array
    {
        $references = [];

        foreach ($this->books() as $book) {
            foreach ($this->aliasesFor($book) as $alias) {
                $pattern = '/(?<![\pL\pN])'.preg_quote($alias, '/').'\s+(?<chapter>\d+)(?::(?<verse>\d+)(?:\s*-\s*(?:(?<end_chapter>\d+):)?(?<end_verse>\d+))?)?/iu';

                preg_match_all($pattern, $value, $matches, PREG_SET_ORDER);

                foreach ($matches as $match) {
                    $references[] = new ParsedBibleReference(
                        book: $book,
                        chapter: (int) $match['chapter'],
                        startVerse: isset($match['verse']) && $match['verse'] !== '' ? (int) $match['verse'] : null,
                        endChapter: isset($match['end_chapter']) && $match['end_chapter'] !== '' ? (int) $match['end_chapter'] : null,
                        endVerse: isset($match['end_verse']) && $match['end_verse'] !== '' ? (int) $match['end_verse'] : null,
                    );
                }
            }
        }

        return collect($references)
            ->unique(fn (ParsedBibleReference $reference): string => implode(':', [
                $reference->book->id,
                $reference->chapter,
                $reference->startVerse,
                $reference->finalChapter(),
                $reference->finalVerse(),
            ]))
            ->values()
            ->all();
    }

    public function stripReferences(string $value): string
    {
        foreach ($this->books() as $book) {
            foreach ($this->aliasesFor($book) as $alias) {
                $pattern = '/(?<![\pL\pN])'.preg_quote($alias, '/').'\s+\d+(?::\d+(?:\s*-\s*(?:\d+:)?\d+)?)?/iu';
                $value = preg_replace($pattern, ' ', $value) ?? $value;
            }
        }

        return trim(preg_replace('/\s+/', ' ', $value) ?? '');
    }

    /**
     * @param  array<int|string, string>  $matches
     */
    private function fromMatches(array $matches): ?ParsedBibleReference
    {
        $book = $this->findBook($matches['book'] ?? $matches[1]);

        if (! $book) {
            return null;
        }

        $chapter = (int) ($matches['chapter'] ?? $matches[2]);
        $startVerse = isset($matches['verse']) && $matches['verse'] !== '' ? (int) $matches['verse'] : null;
        $endChapter = isset($matches['end_chapter']) && $matches['end_chapter'] !== '' ? (int) $matches['end_chapter'] : null;
        $endVerse = isset($matches['end_verse']) && $matches['end_verse'] !== '' ? (int) $matches['end_verse'] : null;

        return new ParsedBibleReference(
            book: $book,
            chapter: $chapter,
            startVerse: $startVerse,
            endChapter: $endChapter,
            endVerse: $endVerse,
        );
    }

    private function referencePattern(bool $anchored = false): string
    {
        $pattern = '(?<book>(?:[1-3]\s*)?[A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)*)\s+(?<chapter>\d+)(?::(?<verse>\d+)(?:\s*-\s*(?:(?<end_chapter>\d+):)?(?<end_verse>\d+))?)?';

        return $anchored ? "/^{$pattern}$/u" : "/{$pattern}/u";
    }

    private function findBook(string $value): ?Book
    {
        $normalized = $this->normalize($value);

        return $this->books()
            ->first(fn (Book $book): bool => in_array($normalized, $this->keysFor($book), true));
    }

    /**
     * @return Collection<int, Book>
     */
    private function books(): Collection
    {
        return $this->books ??= Book::query()
            ->orderBy('position')
            ->get(['id', 'name', 'abbreviation']);
    }

    /**
     * @return array<int, string>
     */
    private function keysFor(Book $book): array
    {
        return array_map($this->normalize(...), $this->aliasesFor($book));
    }

    /**
     * @return array<int, string>
     */
    private function aliasesFor(Book $book): array
    {
        $aliases = array_values(array_unique([
            $book->name,
            $book->abbreviation,
            str_replace(' ', '', $book->name),
            str_replace(' ', '', $book->abbreviation),
        ]));

        usort($aliases, fn (string $left, string $right): int => strlen($right) <=> strlen($left));

        return $aliases;
    }

    private function normalize(string $value): string
    {
        return Str::of($value)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '')
            ->toString();
    }
}
