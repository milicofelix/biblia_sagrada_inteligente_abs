<?php

namespace Tests\Feature;

use App\Jobs\GenerateWorshipJournalStudy;
use App\Models\Bible\WorshipJournalEntry;
use App\Models\User;
use App\Services\Bible\WorshipJournalStudyGenerator;
use Database\Seeders\Bible\BibleCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WorshipJournalTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_user_can_open_worship_journal(): void
    {
        WorshipJournalEntry::query()->create([
            'user_id' => $this->user->id,
            'worship_date' => '2026-06-14',
            'passage_reference' => 'Salmos 44:26',
            'title' => 'Levanta-te em nosso auxilio',
            'status' => 'completed',
            'ai_study' => 'Estudo gerado.',
        ]);

        $this
            ->get('/diario-cultos')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('WorshipJournal')
                ->has('entries', 1)
                ->where('entries.0.passageReference', 'Salmos 44:26')
                ->where('entries.0.title', 'Levanta-te em nosso auxilio')
                ->where('entries.0.progressPercent', 100)
                ->where('entries.0.progressStep', 'concluido'));
    }

    public function test_user_can_store_worship_journal_entry_and_queue_study_generation(): void
    {
        config(['openai.api_key' => 'test-key']);
        Bus::fake();

        $this
            ->post('/diario-cultos', [
                'worship_date' => '2026-06-14',
                'passage_reference' => 'Salmos 44,26',
                'title' => 'Mensagem sobre socorro',
                'church_name' => 'Igreja Local',
                'preacher_name' => 'Pastor Joao',
                'personal_notes' => 'Deus socorre o seu povo.',
            ])
            ->assertRedirect('/diario-cultos');

        $entry = WorshipJournalEntry::query()->firstOrFail();

        $this->assertSame($this->user->id, $entry->user_id);
        $this->assertSame('Salmos 44:26', $entry->passage_reference);
        $this->assertSame('queued', $entry->status);
        $this->assertSame(8, $entry->progress_percent);
        $this->assertSame('registro-salvo', $entry->progress_step);

        Bus::assertDispatched(GenerateWorshipJournalStudy::class);
    }

    public function test_worship_study_job_generates_ai_study_with_local_passage(): void
    {
        config([
            'openai.api_key' => 'test-key',
            'openai.base_url' => 'https://api.openai.com/v1',
            'openai.model' => 'gpt-4.1-mini',
        ]);
        Http::fake([
            'https://api.openai.com/v1/responses' => Http::response([
                'output_text' => 'Resumo do culto gerado pela IA.',
            ]),
        ]);

        $this->seed(BibleCatalogSeeder::class);
        $this->artisan('bible:import', ['path' => 'tests/Fixtures/bible/sample-translation.json']);

        $entry = WorshipJournalEntry::query()->create([
            'user_id' => $this->user->id,
            'worship_date' => '2026-06-14',
            'passage_reference' => 'Joao 3:16',
            'personal_notes' => 'O amor de Deus foi enfatizado.',
            'status' => 'queued',
        ]);

        (new GenerateWorshipJournalStudy($entry->id))->handle(app(WorshipJournalStudyGenerator::class));

        $entry->refresh();

        $this->assertSame('completed', $entry->status);
        $this->assertSame(100, $entry->progress_percent);
        $this->assertSame('concluido', $entry->progress_step);
        $this->assertSame('Resumo do culto gerado pela IA.', $entry->ai_study);
        $this->assertSame('Joao 3:16', $entry->passage[0]['reference']);
        $this->assertNotNull($entry->generated_at);
    }

    public function test_user_cannot_view_another_users_worship_entry(): void
    {
        $entry = WorshipJournalEntry::query()->create([
            'user_id' => $this->user->id,
            'worship_date' => '2026-06-14',
            'passage_reference' => 'Joao 3:16',
            'status' => 'completed',
        ]);

        $this->actingAs(User::factory()->create());

        $this->getJson("/diario-cultos/{$entry->id}")->assertForbidden();
    }

    public function test_worship_entry_requires_openai_key(): void
    {
        config(['openai.api_key' => null]);

        $this
            ->from('/diario-cultos')
            ->post('/diario-cultos', [
                'worship_date' => '2026-06-14',
                'passage_reference' => 'Joao 3:16',
            ])
            ->assertRedirect('/diario-cultos')
            ->assertSessionHasErrors('passage_reference');

        $this->assertSame(0, WorshipJournalEntry::query()->count());
    }
}
