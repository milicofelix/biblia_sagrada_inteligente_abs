<?php

namespace Tests\Feature;

use App\Models\Bible\AiAnswer;
use App\Models\Bible\AiQuestion;
use App\Models\Bible\StudyNote;
use App\Models\Bible\Verse;
use App\Models\Bible\VerseFavorite;
use App\Models\User;
use Database\Seeders\Bible\BibleCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_dashboard_renders_the_study_workspace(): void
    {
        $this
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('initialReference', 'Joao 3:16')
                ->has('stats.books')
                ->has('stats.verses')
                ->has('stats.notes')
                ->has('stats.favorites')
                ->has('stats.agentRuns')
                ->has('recentAnswers')
                ->has('recentNotes')
                ->has('recentFavorites')
                ->where('activeReadingPlan', null));
    }

    public function test_dashboard_lists_recent_ai_answers(): void
    {
        $question = AiQuestion::query()->create([
            'user_id' => $this->user->id,
            'question' => 'Como estudar perseveranca?',
            'intent' => 'biblical_study',
        ]);

        $answer = AiAnswer::query()->create([
            'question_id' => $question->id,
            'model' => 'gpt-4.1-mini',
            'answer' => 'Conteudo do estudo.',
            'citations' => [],
        ]);

        $answer->agentRuns()->create([
            'agent' => 'study',
            'status' => 'completed',
            'output' => ['text' => 'Resumo e flashcards.'],
        ]);

        $this
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('recentAnswers', 1)
                ->where('recentAnswers.0.question', 'Como estudar perseveranca?')
                ->where('recentAnswers.0.sections.0.title', 'Estudos'));
    }

    public function test_dashboard_lists_recent_study_notes(): void
    {
        $this->seed(BibleCatalogSeeder::class);
        $this->artisan('bible:import', ['path' => 'tests/Fixtures/bible/sample-translation.json']);

        $verse = Verse::query()
            ->where('reference', 'Joao 3:16')
            ->firstOrFail();

        StudyNote::query()->create([
            'user_id' => $this->user->id,
            'verse_id' => $verse->id,
            'title' => 'Nota em Joao 3:16',
            'body' => 'Deus toma a iniciativa do amor.',
            'visibility' => 'private',
        ]);

        $this
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('recentNotes', 1)
                ->where('recentNotes.0.reference', 'Joao 3:16')
                ->where('recentNotes.0.translation', 'TST')
                ->where('recentNotes.0.body', 'Deus toma a iniciativa do amor.'));
    }

    public function test_dashboard_lists_recent_favorites_and_default_reading_plan(): void
    {
        $this->seed(BibleCatalogSeeder::class);
        $this->artisan('bible:import', ['path' => 'tests/Fixtures/bible/sample-translation.json']);

        $verse = Verse::query()
            ->where('reference', 'Joao 3:16')
            ->firstOrFail();

        VerseFavorite::query()->create([
            'user_id' => $this->user->id,
            'verse_id' => $verse->id,
        ]);

        $this
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('stats.favorites', 1)
                ->has('recentFavorites', 1)
                ->where('recentFavorites.0.reference', 'Joao 3:16')
                ->where('activeReadingPlan.name', 'Novo Testamento em 90 dias')
                ->where('activeReadingPlan.currentDay.dayNumber', 1));
    }

    public function test_dashboard_includes_daily_verse_when_bible_is_imported(): void
    {
        $this->seed(BibleCatalogSeeder::class);
        $this->artisan('bible:import', ['path' => 'tests/Fixtures/bible/sample-translation.json']);

        $this
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('dailyVerse')
                ->has('dailyVerse.reference')
                ->has('dailyVerse.text')
                ->where('dailyVerse.translation', 'TST'));
    }
}
