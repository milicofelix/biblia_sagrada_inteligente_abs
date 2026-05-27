<?php

namespace App\Services\Bible\Agents;

use App\Services\OpenAI\OpenAIResponsesClient;

abstract class AbstractBibleAgent implements BibleAgent
{
    public function __construct(private readonly OpenAIResponsesClient $client) {}

    /**
     * @param  array<int, array{reference: string, text: string, translation: string|null}>  $verses
     */
    public function analyze(string $question, array $verses): string
    {
        return $this->client->text([
            'instructions' => $this->instructions(),
            'input' => $this->buildInput($question, $verses),
        ]);
    }

    abstract protected function instructions(): string;

    /**
     * @param  array<int, array{reference: string, text: string, translation: string|null}>  $verses
     */
    private function buildInput(string $question, array $verses): string
    {
        $context = collect($verses)
            ->map(fn (array $verse): string => sprintf(
                '- %s%s: %s',
                $verse['reference'],
                $verse['translation'] ? " ({$verse['translation']})" : '',
                $verse['text'],
            ))
            ->implode("\n");

        if ($context === '') {
            $context = 'Nenhum versiculo foi encontrado no indice local ainda.';
        }

        return <<<PROMPT
Pergunta do usuario:
{$question}

Versiculos encontrados no indice local:
{$context}

Responda em portugues do Brasil, com tom pastoral cuidadoso, sem inventar citacoes fora do contexto enviado.
PROMPT;
    }
}
