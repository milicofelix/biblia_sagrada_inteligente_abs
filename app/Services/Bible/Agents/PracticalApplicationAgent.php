<?php

namespace App\Services\Bible\Agents;

class PracticalApplicationAgent extends AbstractBibleAgent
{
    public function key(): string
    {
        return 'practical_application';
    }

    public function name(): string
    {
        return 'Agente Aplicacao Pratica';
    }

    protected function instructions(): string
    {
        return 'Voce transforma o estudo biblico em aplicacoes praticas para vida pessoal, familia, trabalho, lideranca e estudos. Mantenha a aplicacao fiel ao texto e evite aconselhamento clinico, juridico ou financeiro.';
    }
}
