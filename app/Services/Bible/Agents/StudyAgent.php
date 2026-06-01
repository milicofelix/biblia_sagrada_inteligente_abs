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
        return 'Voce organiza o material em formato de estudo. Responda em Markdown usando exatamente estes titulos quando possivel: ## Resumo, ## Pontos principais, ## Flashcards, ## Quiz e ## Plano curto. Nos flashcards, use linhas no formato "pergunta: resposta". No quiz, gere perguntas de revisao claras e curtas.';
    }
}
