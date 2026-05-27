<?php

namespace App\Http\Resources;

use App\Models\Bible\AiAnswer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AiAnswer
 */
class AiAnswerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'question' => $this->question?->question,
            'model' => $this->model,
            'text' => $this->answer,
            'status' => $this->metadata['status'] ?? 'completed',
            'error' => $this->metadata['error'] ?? null,
            'citations' => $this->citations ?? [],
            'createdAt' => $this->created_at?->toISOString(),
            'sections' => $this->agentRuns
                ->map(fn ($run): array => [
                    'agent' => $run->agent,
                    'title' => $this->agentTitle($run->agent),
                    'status' => $run->status,
                    'text' => $run->output['text'] ?? null,
                    'error' => $run->output['error'] ?? null,
                ])
                ->all(),
            'agents' => $this->agentRuns
                ->map(fn ($run): array => [
                    'agent' => $run->agent,
                    'title' => $this->agentTitle($run->agent),
                    'status' => $run->status,
                    'output' => $run->output['text'] ?? null,
                    'error' => $run->output['error'] ?? null,
                ])
                ->all(),
        ];
    }

    private function agentTitle(string $agent): string
    {
        return match ($agent) {
            'theologian' => 'Teologo',
            'biblical_connections' => 'Conexoes Biblicas',
            'practical_application' => 'Aplicacao Pratica',
            'chronology' => 'Cronologia',
            'study' => 'Estudos',
            default => str($agent)->headline()->toString(),
        };
    }
}
