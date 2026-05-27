<?php

namespace Tests\Feature;

use App\Models\Bible\Book;
use App\Models\Bible\Chapter;
use App\Models\Bible\Translation;
use App\Models\Bible\Verse;
use Database\Seeders\Bible\BibleCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BibleImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_seeder_creates_books_and_chapters(): void
    {
        $this->seed(BibleCatalogSeeder::class);

        $this->assertSame(66, Book::query()->count());
        $this->assertSame(1189, Chapter::query()->count());
        $this->assertDatabaseHas('bible_books', [
            'name' => 'Joao',
            'abbreviation' => 'joa',
            'testament' => 'new',
        ]);
    }

    public function test_import_command_imports_translation_and_verses(): void
    {
        $this->seed(BibleCatalogSeeder::class);

        $this
            ->artisan('bible:import', ['path' => 'tests/Fixtures/bible/sample-translation.json'])
            ->assertSuccessful();

        $this->assertSame(1, Translation::query()->count());
        $this->assertSame(3, Verse::query()->count());
        $this->assertDatabaseHas('bible_verses', [
            'reference' => 'Joao 3:16',
            'text' => 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigenito.',
        ]);
    }

    public function test_search_page_returns_imported_verses(): void
    {
        $this->seed(BibleCatalogSeeder::class);
        $this->artisan('bible:import', ['path' => 'tests/Fixtures/bible/sample-translation.json']);

        $this
            ->get('/buscar?q=perseveranca')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->where('search.term', 'perseveranca')
                ->has('search.results', 2));
    }
}
