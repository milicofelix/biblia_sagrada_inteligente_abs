<?php

namespace App\Console\Commands;

use App\Services\Bible\BibleJsonImporter;
use Illuminate\Console\Command;
use InvalidArgumentException;

class ImportBibleJson extends Command
{
    protected $signature = 'bible:import
        {path : Caminho para o arquivo JSON da traducao}
        {--name= : Nome da traducao quando o JSON nao trouxer metadados}
        {--abbr= : Abreviacao da traducao quando o JSON nao trouxer metadados}
        {--language=pt-BR : Idioma da traducao}
        {--source= : Origem do arquivo importado}
        {--default : Marca a traducao como padrao}';

    protected $description = 'Importa uma traducao biblica em JSON para a base FULLTEXT inicial.';

    public function handle(BibleJsonImporter $importer): int
    {
        $path = (string) $this->argument('path');
        $path = str_starts_with($path, '/') ? $path : base_path($path);

        try {
            $result = $importer->import($path, [
                'name' => $this->option('name'),
                'abbreviation' => $this->option('abbr'),
                'language' => $this->option('language'),
                'source' => $this->option('source'),
                'is_default' => $this->option('default') ?: null,
            ]);
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
