<?php

namespace Tests\Feature;

use App\Models\Bible\ReadingPlanDay;
use App\Models\Bible\Verse;
use App\Models\Bible\VerseFavorite;
use Database\Seeders\Bible\BibleCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DailyUseTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_toggle_a_verse_as_favorite(): void
    {
        $verse = $this->importSampleBible();

        $this
            ->postJson("/versiculos/{$verse->id}/favorito")
            ->assertCreated()
            ->assertJsonPath('favorited', true)
            ->assertJsonPath('favorite.reference', 'Joao 3:16')
            ->assertJsonPath('stats.favorites', 1);

        $this->assertDatabaseHas('verse_favorites', [
            'verse_id' => $verse->id,
        ]);

        $this
            ->postJson("/versiculos/{$verse->id}/favorito")
            ->assertOk()
            ->assertJsonPath('favorited', false)
            ->assertJsonPath('stats.favorites', 0);

        $this->assertDatabaseMissing('verse_favorites', [
            'verse_id' => $verse->id,
        ]);
    }

    public function test_search_results_include_favorite_status(): void
    {
        $verse = $this->importSampleBible();

        VerseFavorite::query()->create([
            'verse_id' => $verse->id,
        ]);

        $this
            ->get('/buscar?q=Joao%203%3A16')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('search.results.0.reference', 'Joao 3:16')
                ->where('search.results.0.isFavorited', true));
    }

    public function test_dashboard_includes_default_reading_plan(): void
    {
        $this->importSampleBible();

        $this
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('activeReadingPlan.name', 'Novo Testamento em 90 dias')
                ->where('activeReadingPlan.currentDay.dayNumber', 1));
    }

    public function test_user_can_complete_current_reading_plan_day(): void
    {
        $this->importSampleBible();
        $this->get('/')->assertOk();

        $day = ReadingPlanDay::query()
            ->orderBy('day_number')
            ->firstOrFail();

        $this
            ->postJson("/planos-leitura/dias/{$day->id}/concluir")
            ->assertOk()
            ->assertJsonPath('plan.completedDays', 1);

        $this->assertNotNull($day->refresh()->completed_at);
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
