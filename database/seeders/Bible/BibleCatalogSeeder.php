<?php

namespace Database\Seeders\Bible;

use App\Models\Bible\Book;
use App\Models\Bible\Chapter;
use Illuminate\Database\Seeder;

class BibleCatalogSeeder extends Seeder
{
    public function run(): void
    {
        foreach (config('bible.books') as $index => $bookData) {
            $book = Book::query()->updateOrCreate(
                ['abbreviation' => $bookData['abbreviation']],
                [
                    'name' => $bookData['name'],
                    'testament' => $bookData['testament'],
                    'position' => $index + 1,
                    'chapters_count' => $bookData['chapters_count'],
                ],
            );

            for ($chapterNumber = 1; $chapterNumber <= $book->chapters_count; $chapterNumber++) {
                Chapter::query()->updateOrCreate(
                    [
                        'book_id' => $book->id,
                        'number' => $chapterNumber,
                    ],
                    [
                        'summary' => null,
                    ],
                );
            }
        }
    }
}
