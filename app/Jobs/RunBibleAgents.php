<?php

namespace App\Jobs;

use App\Models\Bible\AiAnswer;
use App\Services\Bible\BibleAgentOrchestrator;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class RunBibleAgents implements ShouldQueue
{
    use Queueable;

    public int $timeout = 360;

    public int $tries = 1;

    public function __construct(public readonly int $answerId) {}

    public function handle(): void
    {
        $answer = AiAnswer::query()
            ->with('question')
            ->findOrFail($this->answerId);

        BibleAgentOrchestrator::default()->run($answer);
    }

    public function failed(Throwable $throwable): void
    {
        AiAnswer::query()
            ->whereKey($this->answerId)
            ->update([
                'metadata' => [
                    'status' => 'failed',
                    'error' => $throwable->getMessage(),
                    'finished_at' => now()->toISOString(),
                ],
            ]);
    }
}
