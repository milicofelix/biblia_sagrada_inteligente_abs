<?php

namespace App\Jobs;

use App\Models\Bible\WorshipJournalEntry;
use App\Services\Bible\WorshipJournalStudyGenerator;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class GenerateWorshipJournalStudy implements ShouldQueue
{
    use Queueable;

    public int $timeout = 180;

    public int $tries = 1;

    public function __construct(public int $entryId) {}

    public function handle(WorshipJournalStudyGenerator $generator): void
    {
        $entry = WorshipJournalEntry::query()->findOrFail($this->entryId);

        try {
            $generator->generate($entry);
        } catch (Throwable $throwable) {
            $entry->forceFill([
                'status' => 'failed',
                'progress_percent' => 100,
                'progress_step' => 'falhou',
                'progress_message' => 'O processamento foi interrompido antes de concluir o estudo.',
                'error' => $throwable->getMessage(),
            ])->save();
        }
    }
}
