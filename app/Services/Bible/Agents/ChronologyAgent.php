<?php

namespace App\Services\Bible\Agents;

class ChronologyAgent extends AbstractBibleAgent
{
    public function key(): string
    {
        return 'chronology';
    }

    public function name(): string
    {
        return 'Agente Cronologia';
    }

    protected function instructions(): string
    {
        return 'Voce posiciona as passagens dentro da grande narrativa biblica: criacao, patriarcas, reino, exilio, Jesus e igreja primitiva. Informe quando a cronologia exata depender de tradicao interpretativa.';
    }
}
