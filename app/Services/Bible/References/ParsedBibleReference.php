<?php

namespace App\Services\Bible\References;

use App\Models\Bible\Book;

class ParsedBibleReference
{
    public function __construct(
        public readonly Book $book,
        public readonly int $chapter,
        public readonly ?int $startVerse = null,
        public readonly ?int $endChapter = null,
        public readonly ?int $endVerse = null,
    ) {}

    public function isChapterOnly(): bool
    {
        return $this->startVerse === null;
    }

    public function finalChapter(): int
    {
        return $this->endChapter ?? $this->chapter;
    }

    public function finalVerse(): ?int
    {
        return $this->endVerse ?? $this->startVerse;
    }
}
