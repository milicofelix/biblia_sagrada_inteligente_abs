<?php

namespace Tests\Feature;

use App\Models\Bible\Translation;
use App\Models\User;
use Database\Seeders\Bible\BibleCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function test_user_can_open_settings_with_defaults(): void
    {
        $this
            ->get('/configuracoes')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Settings')
                ->where('settings.initialReference', 'Joao 3:16')
                ->where('settings.theme', 'light')
                ->where('settings.notificationsEnabled', true)
                ->has('translations'));

        $this->assertDatabaseHas('user_settings', [
            'user_id' => $this->user->id,
            'initial_reference' => 'Joao 3:16',
            'theme' => 'light',
            'notifications_enabled' => true,
        ]);
    }

    public function test_user_can_update_personal_settings(): void
    {
        $this->seed(BibleCatalogSeeder::class);
        $this->artisan('bible:import', ['path' => 'tests/Fixtures/bible/sample-translation.json']);
        $translation = Translation::query()->where('abbreviation', 'TST')->firstOrFail();

        $this
            ->patch('/configuracoes', [
                'translation_id' => $translation->id,
                'initial_reference' => 'Romanos 5:3',
                'theme' => 'night',
                'notifications_enabled' => false,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('user_settings', [
            'user_id' => $this->user->id,
            'translation_id' => $translation->id,
            'initial_reference' => 'Romanos 5:3',
            'theme' => 'night',
            'notifications_enabled' => false,
        ]);

        $this
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('initialReference', 'Romanos 5:3')
                ->where('settings.theme', 'night')
                ->where('settings.notificationsEnabled', false));
    }

    public function test_settings_are_isolated_between_users(): void
    {
        $this->patch('/configuracoes', [
            'translation_id' => null,
            'initial_reference' => 'Salmos 23:1',
            'theme' => 'night',
            'notifications_enabled' => false,
        ])->assertRedirect();

        $otherUser = User::factory()->create();
        $this->actingAs($otherUser);

        $this
            ->get('/configuracoes')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('settings.initialReference', 'Joao 3:16')
                ->where('settings.theme', 'light')
                ->where('settings.notificationsEnabled', true));
    }

    public function test_search_uses_users_preferred_translation(): void
    {
        $this->seed(BibleCatalogSeeder::class);
        $this->artisan('bible:import', ['path' => 'tests/Fixtures/bible/sample-translation.json']);
        $this->artisan('bible:import', [
            'path' => 'tests/Fixtures/bible/sample-usfx.xml',
            '--name' => 'Joao Ferreira de Almeida',
            '--abbr' => 'JFA',
        ]);

        $translation = Translation::query()->where('abbreviation', 'JFA')->firstOrFail();

        $this->patch('/configuracoes', [
            'translation_id' => $translation->id,
            'initial_reference' => 'Joao 3:16',
            'theme' => 'light',
            'notifications_enabled' => true,
        ])->assertRedirect();

        $this
            ->get('/buscar?q=Joao%203%3A16')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('search.results', 1)
                ->where('search.results.0.translation', 'JFA'));
    }
}
