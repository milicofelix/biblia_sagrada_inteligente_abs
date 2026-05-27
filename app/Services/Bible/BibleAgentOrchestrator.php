<?php

namespace App\Services\Bible;

use App\Models\Bible\AiAnswer;
use App\Models\Bible\AiQuestion;
use App\Models\Bible\Verse;
use App\Services\Bible\Agents\BibleAgent;
use App\Services\Bible\Agents\BiblicalConnectionsAgent;
use App\Services\Bible\Agents\ChronologyAgent;
use App\Services\Bible\Agents\PracticalApplicationAgent;
use App\Services\Bible\Agents\StudyAgent;
use App\Services\Bible\Agents\TheologianAgent;
use Illuminate\Support\Collection;
use Throwable;

class BibleAgentOrchestrator
{
    /**
     * @param  array<int, BibleAgent>  $agents
     */
    public function __construct(private readonly array $agents = []) {}

    public static function default(): self
    {
        return app(self::class, [
            'agents' => [
                app(TheologianAgent::class),
                app(BiblicalConnectionsAgent::class),
                app(PracticalApplicationAgent::class),
                app(ChronologyAgent::class),
                app(StudyAgent::class),
            ],
        ]);
    }

    public function answer(string $question): AiAnswer
    {
        return $this->run($this->createPendingAnswer($question));
    }

    public function createPendingAnswer(string $question): AiAnswer
    {
        $verses = $this->findVerses($question);
        $citations = $this->citations($verses);

        $aiQuestion = AiQuestion::query()->create([
            'question' => $question,
            'verse_id' => $verses->first()?->id,
            'intent' => 'biblical_study',
            'metadata' => ['source' => 'dashboard'],
        ]);

        $answer = AiAnswer::query()->create([
            'question_id' => $aiQuestion->id,
            'model' => config('openai.model'),
            'answer' => '',
            'citations' => $citations,
            'metadata' => [
                'agents' => collect($this->agents)->map->key()->all(),
                'status' => 'queued',
            ],
        ]);

        return $answer->load('question', 'agentRuns');
    }

    public function run(AiAnswer $answer): AiAnswer
    {
        $answer->loadMissing('question');

        $sections = [];
        $agentInput = $answer->citations ?? [];

        $answer->update([
            'metadata' => [
                ...($answer->metadata ?? []),
                'status' => 'running',
                'started_at' => now()->toISOString(),
            ],
        ]);

        $hasFailures = false;

        foreach ($this->agents as $agent) {
            $run = $answer->agentRuns()->create([
                'agent' => $agent->key(),
                'status' => 'running',
                'input' => [
                    'question' => $answer->question?->question,
                    'verses' => $agentInput,
                ],
                'started_at' => now(),
            ]);

            try {
                $output = $agent->analyze((string) $answer->question?->question, $agentInput);
                $sections[] = "## {$agent->name()}\n\n{$output}";

                $run->update([
                    'status' => 'completed',
                    'output' => ['text' => $output],
                    'finished_at' => now(),
                ]);
            } catch (Throwable $throwable) {
                $hasFailures = true;
                $output = $this->failureMessage($agent->name());
                $sections[] = "## {$agent->name()}\n\n{$output}";

                $run->update([
                    'status' => 'failed',
                    'output' => [
                        'text' => $output,
                        'error' => $throwable->getMessage(),
                    ],
                    'finished_at' => now(),
                ]);
            }
        }

        $answer->update([
            'answer' => trim(implode("\n\n", $sections)),
            'metadata' => [
                ...($answer->metadata ?? []),
                'status' => $hasFailures ? 'completed_with_errors' : 'completed',
                'finished_at' => now()->toISOString(),
            ],
        ]);

        return $answer->refresh()->load('question', 'agentRuns');
    }

    /**
     * @return Collection<int, Verse>
     */
    private function findVerses(string $question): Collection
    {
        $verses = Verse::query()
            ->with(['translation:id,abbreviation'])
            ->search($question)
            ->limit(8)
            ->get();

        if ($verses->isNotEmpty()) {
            return $verses;
        }

        return Verse::query()
            ->with(['translation:id,abbreviation'])
            ->latest('id')
            ->limit(8)
            ->get();
    }

    /**
     * @param  Collection<int, Verse>  $verses
     * @return array<int, array{reference: string, text: string, translation: string|null}>
     */
    private function citations(Collection $verses): array
    {
        return $verses
            ->map(fn (Verse $verse): array => [
                'reference' => $verse->reference,
                'text' => $verse->text,
                'translation' => $verse->translation?->abbreviation,
            ])
            ->all();
    }

    private function failureMessage(string $agentName): string
    {
        return "O {$agentName} nao conseguiu concluir esta analise nesta tentativa. As outras secoes foram preservadas; tente reenviar a pergunta se quiser completar esta parte.";
    }
}
