<?php

namespace App\Console\Commands;

use App\Services\Bible\BibleJsonImporter;
use App\Services\Bible\BibleUsfxImporter;
use Illuminate\Console\Command;
use Illuminate\Support\Str;
use InvalidArgumentException;

class ImportBibleJson extends Command
{
    protected $signature = 'bible:import
        {path : Caminho para o arquivo JSON ou XML USFX da traducao}
        {--name= : Nome da traducao quando o JSON nao trouxer metadados}
        {--abbr= : Abreviacao da traducao quando o JSON nao trouxer metadados}
        {--language=pt-BR : Idioma da traducao}
        {--source= : Origem do arquivo importado}
        {--default : Marca a traducao como padrao}';

    protected $description = 'Importa uma traducao biblica em JSON ou XML USFX para a base FULLTEXT inicial.';

    public function handle(BibleJsonImporter $jsonImporter, BibleUsfxImporter $usfxImporter): int
    {
        $path = (string) $this->argument('path');
        $path = str_starts_with($path, '/') ? $path : base_path($path);

        try {
            $options = [
                'name' => $this->option('name'),
                'abbreviation' => $this->option('abbr'),
                'language' => $this->option('language'),
                'source' => $this->option('source'),
                'is_default' => $this->option('default') ?: null,
            ];

            $result = str_ends_with(Str::lower($path), '.xml')
                ? $usfxImporter->import($path, $options)
                : $jsonImporter->import($path, $options);
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
