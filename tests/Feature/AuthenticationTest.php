<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Bible\AuthDailyPsalmResolver;
use Database\Seeders\Bible\BibleCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/')->assertRedirect('/login');
    }

    public function test_login_uses_fallback_psalm_when_bible_is_not_imported(): void
    {
        $this
            ->get('/login')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Auth/Login')
                ->where('dailyPsalm.reference', 'Salmos 119:105')
                ->where('dailyPsalm.text', 'Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.')
                ->where('dailyPsalm.translation', null));
    }

    public function test_login_and_register_use_a_psalm_from_imported_bible(): void
    {
        $this->seed(BibleCatalogSeeder::class);
        $this->artisan('bible:import', ['path' => 'tests/Fixtures/bible/nested-books.json']);

        $this
            ->get('/login')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Auth/Login')
                ->where('dailyPsalm.reference', fn (string $reference) => str_starts_with($reference, 'Salmos '))
                ->where('dailyPsalm.translation', 'NST'));

        $this
            ->get('/cadastro')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Auth/Register')
                ->where('dailyPsalm.reference', fn (string $reference) => str_starts_with($reference, 'Salmos '))
                ->where('dailyPsalm.translation', 'NST'));
    }

    public function test_daily_psalm_stays_the_same_during_the_day_and_changes_on_the_next_day(): void
    {
        $this->seed(BibleCatalogSeeder::class);
        $this->artisan('bible:import', ['path' => 'tests/Fixtures/bible/nested-books.json']);

        $resolver = app(AuthDailyPsalmResolver::class);
        $morning = $resolver->forDate(Carbon::parse('2026-06-03 08:00:00'));
        $evening = $resolver->forDate(Carbon::parse('2026-06-03 21:00:00'));
        $nextDay = $resolver->forDate(Carbon::parse('2026-06-04 08:00:00'));

        $this->assertSame($morning, $evening);
        $this->assertNotSame($morning['reference'], $nextDay['reference']);
    }

    public function test_user_can_register_and_logout(): void
    {
        $this->post('/cadastro', [
            'name' => 'Adriano',
            'email' => 'adriano@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect('/');

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['email' => 'adriano@example.com']);

        $this->post('/logout')->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_user_can_login(): void
    {
        $user = User::factory()->create([
            'email' => 'leitor@example.com',
            'password' => 'password',
        ]);

        $this->post('/login', [
            'email' => 'leitor@example.com',
            'password' => 'password',
        ])->assertRedirect('/');

        $this->assertAuthenticatedAs($user);
    }
}
