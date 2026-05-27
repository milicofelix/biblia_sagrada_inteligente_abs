<?php

namespace App\Services\Bible;

use App\Models\Bible\Book;
use App\Models\Bible\Chapter;
use App\Models\Bible\Translation;
use App\Models\Bible\Verse;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use InvalidArgumentException;
use XMLReader;

class BibleUsfxImporter
{
    /**
     * @var array<string, string>
     */
    private array $bookCodes = [
        'GEN' => 'Genesis',
        'EXO' => 'Exodo',
        'LEV' => 'Levitico',
        'NUM' => 'Numeros',
        'DEU' => 'Deuteronomio',
        'JOS' => 'Josue',
        'JDG' => 'Juizes',
        'RUT' => 'Rute',
        '1SA' => '1 Samuel',
        '2SA' => '2 Samuel',
        '1KI' => '1 Reis',
        '2KI' => '2 Reis',
        '1CH' => '1 Cronicas',
        '2CH' => '2 Cronicas',
        'EZR' => 'Esdras',
        'NEH' => 'Neemias',
        'EST' => 'Ester',
        'JOB' => 'Jo',
        'PSA' => 'Salmos',
        'PRO' => 'Proverbios',
        'ECC' => 'Eclesiastes',
        'SNG' => 'Canticos',
        'ISA' => 'Isaias',
        'JER' => 'Jeremias',
        'LAM' => 'Lamentacoes',
        'EZK' => 'Ezequiel',
        'DAN' => 'Daniel',
        'HOS' => 'Oseias',
        'JOL' => 'Joel',
        'AMO' => 'Amos',
        'OBA' => 'Obadias',
        'JON' => 'Jonas',
        'MIC' => 'Miqueias',
        'NAM' => 'Naum',
        'HAB' => 'Habacuque',
        'ZEP' => 'Sofonias',
        'HAG' => 'Ageu',
        'ZEC' => 'Zacarias',
        'MAL' => 'Malaquias',
        'MAT' => 'Mateus',
        'MRK' => 'Marcos',
        'LUK' => 'Lucas',
        'JHN' => 'Joao',
        'ACT' => 'Atos',
        'ROM' => 'Romanos',
        '1CO' => '1 Corintios',
        '2CO' => '2 Corintios',
        'GAL' => 'Galatas',
        'EPH' => 'Efesios',
        'PHP' => 'Filipenses',
        'COL' => 'Colossenses',
        '1TH' => '1 Tessalonicenses',
        '2TH' => '2 Tessalonicenses',
        '1TI' => '1 Timoteo',
        '2TI' => '2 Timoteo',
        'TIT' => 'Tito',
        'PHM' => 'Filemom',
        'HEB' => 'Hebreus',
        'JAS' => 'Tiago',
        '1PE' => '1 Pedro',
        '2PE' => '2 Pedro',
        '1JN' => '1 Joao',
        '2JN' => '2 Joao',
        '3JN' => '3 Joao',
        'JUD' => 'Judas',
        'REV' => 'Apocalipse',
    ];

    public function import(string $path, array $translationOverrides = []): BibleImportResult
    {
        if (! is_file($path)) {
            throw new InvalidArgumentException("Arquivo nao encontrado: {$path}");
        }

        $translation = $this->upsertTranslation($translationOverrides);
        $reader = new XMLReader;

        if (! $reader->open($path)) {
            throw new InvalidArgumentException("Nao foi possivel abrir o arquivo XML: {$path}");
        }

        $booksTouched = [];
        $chaptersTouched = [];
        $versesImported = 0;
        $batch = [];
        $chapterCache = [];
        $currentBook = null;
        $currentChapter = null;
        $currentVerse = null;
        $buffer = '';

        try {
            while ($reader->read()) {
                if ($reader->nodeType === XMLReader::ELEMENT) {
                    if ($reader->name === 'book') {
                        $currentBook = $this->resolveBookCode((string) $reader->getAttribute('id'));
                    }

                    if ($reader->name === 'c') {
                        $currentChapter = (int) $reader->getAttribute('id');
                    }

                    if ($reader->name === 'v') {
                        $currentVerse = (int) $reader->getAttribute('id');
                        $buffer = '';
                    }

                    if ($reader->name === 've' && $currentBook && $currentChapter && $currentVerse) {
                        $text = $this->cleanText($buffer);

                        if ($text !== '') {
                            $chapter = $this->chapterFor($currentBook, $currentChapter, $chapterCache);
                            $now = now();

                            $batch[] = [
                                'translation_id' => $translation->id,
                                'book_id' => $currentBook->id,
                                'chapter_id' => $chapter->id,
                                'chapter_number' => $currentChapter,
                                'verse_number' => $currentVerse,
                                'reference' => "{$currentBook->name} {$currentChapter}:{$currentVerse}",
                                'text' => $text,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ];

                            $booksTouched[$currentBook->id] = true;
                            $chaptersTouched[$chapter->id] = true;
                            $versesImported++;

                            if (count($batch) >= 1000) {
                                $this->flushVerses($batch);
                            }
                        }

                        $currentVerse = null;
                        $buffer = '';
                    }
                }

                if (in_array($reader->nodeType, [XMLReader::TEXT, XMLReader::CDATA, XMLReader::SIGNIFICANT_WHITESPACE], true) && $currentVerse) {
                    $buffer .= ' '.$reader->value;
                }
            }
        } finally {
            $reader->close();
        }

        $this->flushVerses($batch);

        return new BibleImportResult(
            translations: 1,
            books: count($booksTouched),
            chapters: count($chaptersTouched),
            verses: $versesImported,
        );
    }

    private function upsertTranslation(array $data): Translation
    {
        return Translation::query()->updateOrCreate(
            ['abbreviation' => Str::upper($data['abbreviation'] ?? 'JFA')],
            [
                'name' => $data['name'] ?? 'Joao Ferreira de Almeida',
                'language' => $data['language'] ?? 'pt-BR',
                'source' => $data['source'] ?? null,
                'copyright' => $data['copyright'] ?? 'Public Domain',
                'is_default' => (bool) Arr::get($data, 'is_default', false),
            ],
        );
    }

    private function resolveBookCode(string $code): Book
    {
        $bookName = $this->bookCodes[$code] ?? null;

        if (! $bookName) {
            throw new InvalidArgumentException("Livro USFX nao mapeado: {$code}");
        }

        $book = Book::query()
            ->where('name', $bookName)
            ->first();

        if (! $book) {
            throw new InvalidArgumentException("Livro nao encontrado no catalogo: {$bookName}");
        }

        return $book;
    }

    /**
     * @param  array<string, Chapter>  $cache
     */
    private function chapterFor(Book $book, int $chapterNumber, array &$cache): Chapter
    {
        $key = "{$book->id}:{$chapterNumber}";

        if (isset($cache[$key])) {
            return $cache[$key];
        }

        return $cache[$key] = Chapter::query()->firstOrCreate([
            'book_id' => $book->id,
            'number' => $chapterNumber,
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $batch
     */
    private function flushVerses(array &$batch): void
    {
        if ($batch === []) {
            return;
        }

        Verse::query()->upsert(
            $batch,
            ['translation_id', 'book_id', 'chapter_number', 'verse_number'],
            ['chapter_id', 'reference', 'text', 'updated_at'],
        );

        $batch = [];
    }

    private function cleanText(string $text): string
    {
        return trim(preg_replace('/\s+/u', ' ', str_replace("\u{00a0}", ' ', $text)) ?? '');
    }
}
