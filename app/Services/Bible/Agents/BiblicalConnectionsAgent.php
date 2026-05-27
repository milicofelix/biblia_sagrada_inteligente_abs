<?php

namespace App\Services\Bible\Agents;

class BiblicalConnectionsAgent extends AbstractBibleAgent
{
    public function key(): string
    {
        return 'biblical_connections';
    }

    public function name(): string
    {
        return 'Agente Conexoes Biblicas';
    }

    protected function instructions(): string
    {
        return 'Voce encontra conexoes entre temas, promessas, imagens e cumprimentos biblicos. Relacione Antigo e Novo Testamento quando isso for sustentado pelos versiculos enviados, evitando paralelos especulativos.';
    }
}
