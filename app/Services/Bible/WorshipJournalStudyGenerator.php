<?php

namespace App\Services\Bible;

use App\Models\Bible\Verse;
use App\Models\Bible\WorshipJournalEntry;
use App\Services\Bible\References\BiblePassageLookup;
use App\Services\OpenAI\OpenAIResponsesClient;
use App\Services\UserSettingsResolver;
use Illuminate\Support\Collection;

class WorshipJournalStudyGenerator
{
    public function __construct(
        private readonly BiblePassageLookup $passageLookup,
        private readonly OpenAIResponsesClient $client,
        private readonly UserSettingsResolver $settingsResolver,
    ) {}

    public function generate(WorshipJournalEntry $entry): WorshipJournalEntry
    {
        $entry->loadMissing('user');
        $entry->markProgress(15, 'iniciando', 'O agente iniciou a leitura do registro do culto.', 'running');

        $settings = $this->settingsResolver->forUser($entry->user);
        $translationId = $this->settingsResolver->preferredTranslationId($settings);

        $entry->markProgress(30, 'localizando-passagem', 'Localizando a passagem biblica na traducao preferida.');

        $verses = $this->passageLookup->search($entry->passage_reference, 80, $translationId);
        $passage = $this->serializePassage($verses);

        $entry->forceFill([
            'verse_id' => $verses->first()?->id,
            'passage' => $passage,
            'error' => null,
        ])->save();

        $entry->markProgress(50, 'preparando-contexto', 'Organizando passagem, tema, igreja, pregador e anotacoes pessoais.');
        $input = $this->input($entry, $passage);

        $entry->markProgress(72, 'consultando-ia', 'Enviando o conteudo para o agente IA gerar o estudo pastoral.');

        $study = $this->client->text([
            'instructions' => $this->instructions(),
            'input' => $input,
        ]);

        $entry->markProgress(92, 'salvando-estudo', 'Resposta recebida. Salvando resumo, contexto e aplicacoes no diario.');

        $entry->forceFill([
            'ai_study' => $study,
            'status' => 'completed',
            'progress_percent' => 100,
            'progress_step' => 'concluido',
            'progress_message' => 'Estudo concluido e salvo no Diario de Cultos.',
            'generated_at' => now(),
        ])->save();

        return $entry->refresh();
    }

    private function instructions(): string
    {
        return <<<'PROMPT'
Voce e um agente especializado em Diario de Cultos. Sua tarefa e transformar uma passagem pregada em um culto em um estudo biblico pastoral, fiel ao texto e util para revisao posterior.

Responda em portugues do Brasil com estas secoes:
1. Resumo do culto
2. Texto e contexto da passagem
3. Interpretacao biblica
4. Conexoes com outras passagens
5. Aplicacoes praticas
6. Perguntas para reflexao
7. Oracao sugerida

Nao invente dados sobre igreja, pregador ou tema. Quando algo nao for informado, diga apenas que nao foi registrado. Use as anotacoes pessoais como memoria do culto, mas diferencie anotacao de interpretacao.
PROMPT;
    }

    /**
     * @param  array<int, array{reference: string, text: string, translation: string|null}>  $passage
     */
    private function input(WorshipJournalEntry $entry, array $passage): string
    {
        $passageText = collect($passage)
            ->map(fn (array $verse): string => sprintf(
                '- %s%s: %s',
                $verse['reference'],
                $verse['translation'] ? " ({$verse['translation']})" : '',
                $verse['text'],
            ))
            ->implode("\n");

        if ($passageText === '') {
            $passageText = 'Nenhum texto foi encontrado no indice local para esta passagem.';
        }

        $notes = $entry->personal_notes ?: 'Nenhuma anotacao pessoal foi registrada.';
        $title = $entry->title ?: 'Tema nao registrado.';
        $church = $entry->church_name ?: 'Igreja/local nao registrado.';
        $preacher = $entry->preacher_name ?: 'Pregador nao registrado.';

        return <<<PROMPT
Data do culto: {$entry->worship_date?->format('d/m/Y')}
Passagem registrada: {$entry->passage_reference}
Tema/titulo: {$title}
Igreja/local: {$church}
Pregador: {$preacher}

Anotacoes pessoais:
{$notes}

Texto biblico encontrado:
{$passageText}
PROMPT;
    }

    /**
     * @param  Collection<int, Verse>  $verses
     * @return array<int, array{reference: string, text: string, translation: string|null}>
     */
    private function serializePassage(Collection $verses): array
    {
        return $verses
            ->map(fn (Verse $verse): array => [
                'reference' => $verse->reference,
                'text' => $verse->text,
                'translation' => $verse->translation?->abbreviation,
            ])
            ->values()
            ->all();
    }
}
