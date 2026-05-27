<?php

namespace App\Services\Bible;

readonly class BibleImportResult
{
    public function __construct(
        public int $translations,
        public int $books,
        public int $chapters,
        public int $verses,
    ) {}

    public function toArray(): array
    {
        return [
            'translations' => $this->translations,
            'books' => $this->books,
            'chapters' => $this->chapters,
            'verses' => $this->verses,
        ];
    }
}
