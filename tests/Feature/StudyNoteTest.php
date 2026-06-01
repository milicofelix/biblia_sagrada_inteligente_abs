<?php

namespace Tests\Feature;

use App\Models\Bible\StudyNote;
use App\Models\Bible\Verse;
use Database\Seeders\Bible\BibleCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudyNoteTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_store_study_note_for_verse(): void
    {
        $verse = $this->importSampleBible();

        $this
            ->postJson("/versiculos/{$verse->id}/notas", [
                'body' => 'Cristo e o centro da perseveranca.',
            ])
            ->assertCreated()
            ->assertJsonPath('note.verseId', $verse->id)
            ->assertJsonPath('note.body', 'Cristo e o centro da perseveranca.')
            ->assertJsonPath('stats.notes', 1);

        $this->assertDatabaseHas('study_notes', [
            'verse_id' => $verse->id,
            'body' => 'Cristo e o centro da perseveranca.',
        ]);
    }

    public function test_search_results_include_latest_study_note(): void
    {
        $verse = $this->importSampleBible();

        StudyNote::query()->create([
            'verse_id' => $verse->id,
            'title' => 'Nota em Joao 3:16',
            'body' => 'Deus toma a iniciativa do amor.',
            'visibility' => 'private',
        ]);

        $this
            ->get('/buscar?q=Joao%203%3A16')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->where('search.results.0.latestNote.body', 'Deus toma a iniciativa do amor.'));
    }

    private function importSampleBible(): Verse
    {
        $this->seed(BibleCatalogSeeder::class);
        $this->artisan('bible:import', ['path' => 'tests/Fixtures/bible/sample-translation.json']);

        return Verse::query()
            ->where('reference', 'Joao 3:16')
            ->firstOrFail();
    }
}
