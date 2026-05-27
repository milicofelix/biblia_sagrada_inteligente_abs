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

        if (! preg_match('/^(.+?)\s+(\d+)(?::(\d+)(?:\s*-\s*(?:(\d+):)?(\d+))?)?$/u', $value, $matches)) {
            return null;
        }

        $book = $this->findBook($matches[1]);

        if (! $book) {
            return null;
        }

        $chapter = (int) $matches[2];
        $startVerse = isset($matches[3]) && $matches[3] !== '' ? (int) $matches[3] : null;
        $endChapter = isset($matches[4]) && $matches[4] !== '' ? (int) $matches[4] : null;
        $endVerse = isset($matches[5]) && $matches[5] !== '' ? (int) $matches[5] : null;

        return new ParsedBibleReference(
            book: $book,
            chapter: $chapter,
            startVerse: $startVerse,
            endChapter: $endChapter,
            endVerse: $endVerse,
        );
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
        return array_values(array_unique([
            $this->normalize($book->name),
            $this->normalize($book->abbreviation),
            $this->normalize(str_replace(' ', '', $book->name)),
            $this->normalize(str_replace(' ', '', $book->abbreviation)),
        ]));
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
