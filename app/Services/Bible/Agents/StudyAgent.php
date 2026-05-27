<?php

namespace App\Services\Bible\Agents;

class StudyAgent extends AbstractBibleAgent
{
    public function key(): string
    {
        return 'study';
    }

    public function name(): string
    {
        return 'Agente de Estudos';
    }

    protected function instructions(): string
    {
        return 'Voce organiza o material em formato de estudo: resumo, pontos principais, perguntas de revisao, flashcards e sugestao curta de plano de leitura.';
    }
}
