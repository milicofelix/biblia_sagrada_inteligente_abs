<?php

namespace App\Console\Commands;

use App\Services\Bible\BibleJsonImporter;
use Illuminate\Console\Command;
use InvalidArgumentException;

class ImportBibleJson extends Command
{
    protected $signature = 'bible:import {path : Caminho para o arquivo JSON da traducao}';

    protected $description = 'Importa uma traducao biblica em JSON para a base FULLTEXT inicial.';

    public function handle(BibleJsonImporter $importer): int
    {
        $path = (string) $this->argument('path');
        $path = str_starts_with($path, '/') ? $path : base_path($path);

        try {
            $result = $importer->import($path);
        } catch (InvalidArgumentException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info('Importacao concluida.');
        $this->table(
            ['Traducoes', 'Livros', 'Capitulos', 'Versiculos'],
            [array_values($result->toArray())],
        );

        return self::SUCCESS;
    }
}
