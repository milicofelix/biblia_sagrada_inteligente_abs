<?php

namespace App\Services\Bible;

use App\Models\Bible\Book;
use App\Models\Bible\Chapter;
use App\Models\Bible\Translation;
use App\Models\Bible\Verse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use InvalidArgumentException;

class BibleJsonImporter
{
    public function import(string $path, array $translationOverrides = []): BibleImportResult
    {
        if (! is_file($path)) {
            throw new InvalidArgumentException("Arquivo nao encontrado: {$path}");
        }

        $payload = json_decode((string) file_get_contents($path), true);

        if (! is_array($payload)) {
            throw new InvalidArgumentException('O arquivo informado nao contem um JSON valido.');
        }

        $payload = $this->normalizePayload($payload, $translationOverrides);
        $this->validate($payload);

        return DB::transaction(function () use ($payload): BibleImportResult {
            $translation = $this->upsertTranslation($payload['translation']);

            $booksTouched = [];
            $chaptersTouched = [];
            $versesImported = 0;

            foreach ($payload['verses'] as $verseData) {
                $book = $this->resolveBook($verseData['book']);
                $chapter = Chapter::query()->firstOrCreate([
                    'book_id' => $book->id,
                    'number' => (int) $verseData['chapter'],
                ]);

                Verse::query()->updateOrCreate(
                    [
                        'translation_id' => $translation->id,
                        'book_id' => $book->id,
                        'chapter_number' => (int) $verseData['chapter'],
                        'verse_number' => (int) $verseData['verse'],
                    ],
                    [
                        'chapter_id' => $chapter->id,
                        'reference' => $this->referenceFor($book->name, (int) $verseData['chapter'], (int) $verseData['verse']),
                        'text' => trim($verseData['text']),
                    ],
                );

                $booksTouched[$book->id] = true;
                $chaptersTouched[$chapter->id] = true;
                $versesImported++;
            }

            return new BibleImportResult(
                translations: 1,
                books: count($booksTouched),
                chapters: count($chaptersTouched),
                verses: $versesImported,
            );
        });
    }

    private function normalizePayload(array $payload, array $translationOverrides): array
    {
        $translation = array_filter([
            'name' => $translationOverrides['name'] ?? null,
            'abbreviation' => $translationOverrides['abbreviation'] ?? null,
            'language' => $translationOverrides['language'] ?? null,
            'source' => $translationOverrides['source'] ?? null,
            'copyright' => $translationOverrides['copyright'] ?? null,
            'is_default' => $translationOverrides['is_default'] ?? null,
        ], fn ($value): bool => $value !== null);

        if (isset($payload['translation']) && is_array($payload['translation'])) {
            $translation = [
                ...$payload['translation'],
                ...$translation,
            ];
        }

        if (isset($payload['verses']) && is_array($payload['verses'])) {
            return [
                'translation' => $translation,
                'verses' => $this->normalizeFlatVerses($payload['verses']),
            ];
        }

        if (isset($payload['books']) && is_array($payload['books'])) {
            return [
                'translation' => $translation,
                'verses' => $this->normalizeBooks($payload['books']),
            ];
        }

        if (array_is_list($payload)) {
            return [
                'translation' => $translation,
                'verses' => $this->normalizeFlatVerses($payload),
            ];
        }

        throw new InvalidArgumentException('Formato JSON nao reconhecido. Use "verses", "books" ou uma lista de versiculos.');
    }

    private function normalizeFlatVerses(array $verses): array
    {
        return array_map(function (array $verse): array {
            return [
                'book' => $verse['book'] ?? $verse['book_name'] ?? $verse['bookName'] ?? $verse['livro'] ?? $verse['abbrev'] ?? null,
                'chapter' => $verse['chapter'] ?? $verse['chapter_number'] ?? $verse['chapterNumber'] ?? $verse['capitulo'] ?? null,
                'verse' => $verse['verse'] ?? $verse['verse_number'] ?? $verse['verseNumber'] ?? $verse['versiculo'] ?? null,
                'text' => $verse['text'] ?? $verse['content'] ?? $verse['texto'] ?? null,
            ];
        }, $verses);
    }

    private function normalizeBooks(array $books): array
    {
        $verses = [];

        foreach ($books as $book) {
            $bookName = $book['name'] ?? $book['book'] ?? $book['livro'] ?? $book['abbrev'] ?? null;
            $chapters = $book['chapters'] ?? $book['capitulos'] ?? [];

            foreach ($chapters as $chapterIndex => $chapter) {
                $chapterNumber = $chapter['number'] ?? $chapter['chapter'] ?? $chapter['capitulo'] ?? ($chapterIndex + 1);
                $chapterVerses = $chapter['verses'] ?? $chapter['versiculos'] ?? $chapter;

                foreach ($chapterVerses as $verseIndex => $verse) {
                    if (is_string($verse)) {
                        $verses[] = [
                            'book' => $bookName,
                            'chapter' => $chapterNumber,
                            'verse' => $verseIndex + 1,
                            'text' => $verse,
                        ];

                        continue;
                    }

                    if (! is_array($verse)) {
                        continue;
                    }

                    $verses[] = [
                        'book' => $bookName,
                        'chapter' => $chapterNumber,
                        'verse' => $verse['number'] ?? $verse['verse'] ?? $verse['versiculo'] ?? ($verseIndex + 1),
                        'text' => $verse['text'] ?? $verse['content'] ?? $verse['texto'] ?? null,
                    ];
                }
            }
        }

        return $verses;
    }

    private function validate(array $payload): void
    {
        $validator = Validator::make($payload, [
            'translation' => ['required', 'array'],
            'translation.name' => ['required', 'string', 'max:255'],
            'translation.abbreviation' => ['required', 'string', 'max:24'],
            'translation.language' => ['nullable', 'string', 'max:16'],
            'translation.source' => ['nullable', 'string', 'max:255'],
            'translation.copyright' => ['nullable', 'string'],
            'translation.is_default' => ['nullable', 'boolean'],
            'verses' => ['required', 'array', 'min:1'],
            'verses.*.book' => ['required', 'string', 'max:255'],
            'verses.*.chapter' => ['required', 'integer', 'min:1'],
            'verses.*.verse' => ['required', 'integer', 'min:1'],
            'verses.*.text' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            throw new InvalidArgumentException($validator->errors()->first());
        }
    }

    private function upsertTranslation(array $data): Translation
    {
        return Translation::query()->updateOrCreate(
            ['abbreviation' => Str::upper($data['abbreviation'])],
            [
                'name' => $data['name'],
                'language' => $data['language'] ?? 'pt-BR',
                'source' => $data['source'] ?? null,
                'copyright' => $data['copyright'] ?? null,
                'is_default' => (bool) Arr::get($data, 'is_default', false),
            ],
        );
    }

    private function resolveBook(string $bookName): Book
    {
        $normalized = $this->normalize($bookName);

        $book = Book::query()
            ->get()
            ->first(fn (Book $book): bool => in_array($normalized, [
                $this->normalize($book->name),
                $this->normalize($book->abbreviation),
            ], true));

        if ($book) {
            return $book;
        }

        $position = (int) Book::query()->max('position') + 1;

        return Book::query()->create([
            'name' => trim($bookName),
            'abbreviation' => Str::slug($bookName),
            'testament' => 'old',
            'position' => $position,
            'chapters_count' => 1,
        ]);
    }

    private function referenceFor(string $bookName, int $chapter, int $verse): string
    {
        return "{$bookName} {$chapter}:{$verse}";
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
