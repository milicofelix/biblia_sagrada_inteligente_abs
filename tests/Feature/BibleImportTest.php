<?php

namespace Tests\Feature;

use App\Models\Bible\Book;
use App\Models\Bible\Chapter;
use App\Models\Bible\CrossReference;
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

    public function test_import_command_accepts_flat_verse_lists_with_translation_options(): void
    {
        $this->seed(BibleCatalogSeeder::class);

        $this
            ->artisan('bible:import', [
                'path' => 'tests/Fixtures/bible/flat-verses.json',
                '--name' => 'Lista Plana',
                '--abbr' => 'FLT',
            ])
            ->assertSuccessful();

        $this->assertDatabaseHas('bible_translations', [
            'name' => 'Lista Plana',
            'abbreviation' => 'FLT',
        ]);
        $this->assertDatabaseHas('bible_verses', [
            'reference' => 'Tiago 1:3',
            'text' => 'Sabendo que a prova da vossa fe opera a paciencia.',
        ]);
    }

    public function test_import_command_accepts_nested_book_payloads(): void
    {
        $this->seed(BibleCatalogSeeder::class);

        $this
            ->artisan('bible:import', ['path' => 'tests/Fixtures/bible/nested-books.json'])
            ->assertSuccessful();

        $this->assertDatabaseHas('bible_translations', [
            'abbreviation' => 'NST',
        ]);
        $this->assertDatabaseHas('bible_verses', [
            'reference' => 'Salmos 23:1',
            'text' => 'O Senhor e o meu pastor, nada me faltara.',
        ]);
    }

    public function test_import_command_accepts_usfx_xml_payloads(): void
    {
        $this->seed(BibleCatalogSeeder::class);

        $this
            ->artisan('bible:import', [
                'path' => 'tests/Fixtures/bible/sample-usfx.xml',
                '--name' => 'Joao Ferreira de Almeida',
                '--abbr' => 'JFA',
            ])
            ->assertSuccessful();

        $this->assertDatabaseHas('bible_translations', [
            'abbreviation' => 'JFA',
        ]);
        $this->assertDatabaseHas('bible_verses', [
            'reference' => 'Joao 3:16',
            'text' => 'Porque Deus amou o mundo de tal maneira.',
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

    public function test_search_page_resolves_exact_references_before_fulltext(): void
    {
        $this->seed(BibleCatalogSeeder::class);
        $this->artisan('bible:import', ['path' => 'tests/Fixtures/bible/sample-translation.json']);

        $this
            ->get('/buscar?q=Joao%203%3A16')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->where('search.term', 'Joao 3:16')
                ->has('search.results', 1)
                ->where('search.results.0.reference', 'Joao 3:16'));
    }

    public function test_search_page_resolves_reference_ranges(): void
    {
        $this->seed(BibleCatalogSeeder::class);
        $this->artisan('bible:import', ['path' => 'tests/Fixtures/bible/sample-translation.json']);

        $this
            ->get('/buscar?q=Romanos%205%3A3-4')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->where('search.term', 'Romanos 5:3-4')
                ->has('search.results', 2)
                ->where('search.results.0.reference', 'Romanos 5:3')
                ->where('search.results.1.reference', 'Romanos 5:4'));
    }

    public function test_search_page_includes_cross_references_for_results(): void
    {
        $this->seed(BibleCatalogSeeder::class);
        $this->artisan('bible:import', ['path' => 'tests/Fixtures/bible/sample-translation.json']);

        $source = Verse::query()->where('reference', 'Joao 3:16')->firstOrFail();
        $target = Verse::query()->where('reference', 'Romanos 5:3')->firstOrFail();

        CrossReference::query()->create([
            'source_verse_id' => $source->id,
            'target_verse_id' => $target->id,
            'relationship' => 'perseveranca',
            'notes' => 'O amor de Deus sustenta a perseveranca.',
        ]);

        $this
            ->get('/buscar?q=Joao%203%3A16')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->where('search.results.0.reference', 'Joao 3:16')
                ->has('search.results.0.crossReferences', 1)
                ->where('search.results.0.crossReferences.0.reference', 'Romanos 5:3')
                ->where('search.results.0.crossReferences.0.relationship', 'perseveranca'));

        $this
            ->get('/buscar?q=Romanos%205%3A3')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->where('search.results.0.reference', 'Romanos 5:3')
                ->has('search.results.0.crossReferences', 1)
                ->where('search.results.0.crossReferences.0.reference', 'Joao 3:16')
                ->where('search.results.0.crossReferences.0.direction', 'incoming'));
    }

    public function test_search_page_includes_timeline_context_for_results(): void
    {
        $this->seed(BibleCatalogSeeder::class);
        $this->artisan('bible:import', ['path' => 'tests/Fixtures/bible/sample-translation.json']);

        $this
            ->get('/buscar?q=Joao%203%3A16')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->where('search.results.0.reference', 'Joao 3:16')
                ->where('search.results.0.timeline.book', 'Joao')
                ->where('search.results.0.timeline.testament', 'Novo Testamento')
                ->where('search.results.0.timeline.phase.title', 'Jesus, Reino e Evangelho'));
    }
}
