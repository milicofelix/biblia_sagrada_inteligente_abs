<?php

namespace Tests\Feature;

use App\Models\Bible\AiAnswer;
use App\Models\Bible\AiQuestion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

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
                ->has('stats.agentRuns')
                ->has('recentAnswers'));
    }

    public function test_dashboard_lists_recent_ai_answers(): void
    {
        $question = AiQuestion::query()->create([
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
}
