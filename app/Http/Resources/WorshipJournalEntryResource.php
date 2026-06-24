<?php

namespace App\Http\Resources;

use App\Models\Bible\WorshipJournalEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin WorshipJournalEntry
 */
class WorshipJournalEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'worshipDate' => $this->worship_date?->toDateString(),
            'formattedDate' => $this->worship_date?->format('d/m/Y'),
            'passageReference' => $this->passage_reference,
            'title' => $this->title,
            'churchName' => $this->church_name,
            'preacherName' => $this->preacher_name,
            'personalNotes' => $this->personal_notes,
            'passage' => $this->passage ?? [],
            'aiStudy' => $this->ai_study,
            'status' => $this->status,
            'progressPercent' => $this->resolvedProgressPercent(),
            'progressStep' => $this->progress_step ?? $this->defaultProgressStep(),
            'progressMessage' => $this->progress_message ?? $this->defaultProgressMessage(),
            'error' => $this->error,
            'generatedAt' => $this->generated_at?->toISOString(),
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }

    private function resolvedProgressPercent(): int
    {
        if (($this->progress_percent ?? 0) > 0) {
            return (int) $this->progress_percent;
        }

        return $this->defaultProgressPercent();
    }

    private function defaultProgressPercent(): int
    {
        return match ($this->status) {
            'completed' => 100,
            'running' => 45,
            'queued' => 10,
            'failed' => 100,
            default => 0,
        };
    }

    private function defaultProgressStep(): string
    {
        return match ($this->status) {
            'completed' => 'concluido',
            'running' => 'gerando-estudo',
            'queued' => 'na-fila',
            'failed' => 'falhou',
            default => 'aguardando',
        };
    }

    private function defaultProgressMessage(): string
    {
        return match ($this->status) {
            'completed' => 'Estudo concluido e salvo no Diario de Cultos.',
            'running' => 'O agente esta processando o estudo.',
            'queued' => 'Registro salvo. Aguardando o worker iniciar o processamento.',
            'failed' => 'Nao foi possivel gerar o estudo automaticamente.',
            default => 'Aguardando processamento.',
        };
    }
}
