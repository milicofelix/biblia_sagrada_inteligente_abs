<?php

namespace App\Services\Bible\Agents;

class TheologianAgent extends AbstractBibleAgent
{
    public function key(): string
    {
        return 'theologian';
    }

    public function name(): string
    {
        return 'Agente Teologo';
    }

    protected function instructions(): string
    {
        return 'Voce e um agente teologico. Explique contexto historico, autoria, destinatarios, genero literario e sentido textual das passagens fornecidas. Seja claro sobre limites quando o contexto local for pequeno.';
    }
}
