<?php

namespace Tests\Feature\Ai;

use App\Jobs\RunBibleAgents;
use App\Models\Bible\AgentRun;
use App\Models\Bible\AiAnswer;
use App\Models\Bible\AiQuestion;
use App\Models\Bible\Verse;
use App\Services\Bible\BibleAgentOrchestrator;
use Database\Seeders\Bible\BibleCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AnswerQuestionTest extends TestCase
{
    use RefreshDatabase;

    public function test_answer_endpoint_requires_openai_key(): void
    {
        config(['openai.api_key' => null]);

        $this
            ->postJson('/ai/responder', [
                'question' => 'Existe algo sobre perseveranca?',
            ])
            ->assertStatus(422)
            ->assertJson([
                'message' => 'OPENAI_API_KEY ainda nao esta configurada.',
            ]);

        $this->assertSame(0, AiQuestion::query()->count());
        $this->assertSame(0, AiAnswer::query()->count());
        $this->assertSame(0, AgentRun::query()->count());
    }

    public function test_answer_endpoint_queues_agent_run(): void
    {
        config([
            'openai.api_key' => 'test-key',
            'openai.model' => 'gpt-4.1-mini',
        ]);
        Bus::fake();

        $this
            ->postJson('/ai/responder', [
                'question' => 'Estou desanimado, existe algo sobre perseveranca?',
            ])
            ->assertAccepted()
            ->assertJsonPath('answer.model', 'gpt-4.1-mini')
            ->assertJsonPath('answer.status', 'queued')
            ->assertJsonCount(0, 'answer.agents')
            ->assertJsonCount(0, 'answer.sections');

        $this->assertSame(1, AiQuestion::query()->count());
        $this->assertSame(1, AiAnswer::query()->count());
        $this->assertSame(0, AgentRun::query()->count());
        Bus::assertDispatched(RunBibleAgents::class);
    }

    public function test_answer_context_prioritizes_explicit_bible_references(): void
    {
        config([
            'openai.api_key' => 'test-key',
            'openai.model' => 'gpt-4.1-mini',
        ]);

        $this->seed(BibleCatalogSeeder::class);
        $this->artisan('bible:import', ['path' => 'tests/Fixtures/bible/sample-translation.json']);

        $answer = BibleAgentOrchestrator::default()
            ->createPendingAnswer('Explique Joao 3:16 e conecte com perseveranca.');

        $this->assertSame('Joao 3:16', $answer->citations[0]['reference']);
        $this->assertContains('Romanos 5:3', collect($answer->citations)->pluck('reference'));
    }

    public function test_agent_job_runs_agents_and_persists_answer(): void
    {
        config([
            'openai.api_key' => 'test-key',
            'openai.base_url' => 'https://api.openai.com/v1',
            'openai.model' => 'gpt-4.1-mini',
        ]);
        Http::fake([
            'https://api.openai.com/v1/responses' => Http::response([
                'output_text' => 'Resposta fundamentada no texto enviado.',
            ]),
        ]);

        $this->seed(BibleCatalogSeeder::class);
        $this->artisan('bible:import', ['path' => 'tests/Fixtures/bible/sample-translation.json']);

        $answerId = BibleAgentOrchestrator::default()
            ->createPendingAnswer('Estou desanimado, existe algo sobre perseveranca?')
            ->id;

        (new RunBibleAgents($answerId))->handle();

        $this
            ->getJson("/ai/respostas/{$answerId}")
            ->assertOk()
            ->assertJsonPath('answer.model', 'gpt-4.1-mini')
            ->assertJsonPath('answer.status', 'completed')
            ->assertJsonPath('answer.agents.0.status', 'completed')
            ->assertJsonPath('answer.sections.0.title', 'Teologo')
            ->assertJsonCount(5, 'answer.agents')
            ->assertJsonCount(5, 'answer.sections');

        $this->assertSame(1, AiQuestion::query()->count());
        $this->assertSame(1, AiAnswer::query()->count());
        $this->assertSame(5, AgentRun::query()->count());
        $this->assertGreaterThan(0, Verse::query()->count());
    }

    public function test_agent_job_preserves_partial_answer_when_one_agent_fails(): void
    {
        config([
            'openai.api_key' => 'test-key',
            'openai.base_url' => 'https://api.openai.com/v1',
            'openai.model' => 'gpt-4.1-mini',
        ]);

        Http::fakeSequence()
            ->push(['output_text' => 'Secao concluida.'])
            ->push(fn () => throw new ConnectionException('timeout'))
            ->push(['output_text' => 'Secao concluida.'])
            ->push(['output_text' => 'Secao concluida.'])
            ->push(['output_text' => 'Secao concluida.']);

        $answerId = BibleAgentOrchestrator::default()
            ->createPendingAnswer('Existe algo sobre perseveranca?')
            ->id;

        (new RunBibleAgents($answerId))->handle();

        $this
            ->getJson("/ai/respostas/{$answerId}")
            ->assertOk()
            ->assertJsonPath('answer.status', 'completed_with_errors')
            ->assertJsonPath('answer.agents.1.status', 'failed')
            ->assertJsonPath('answer.sections.1.title', 'Conexoes Biblicas')
            ->assertJsonCount(5, 'answer.sections');
    }
}
