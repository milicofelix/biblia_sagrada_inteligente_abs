<?php

namespace App\Console\Commands;

use App\Models\Bible\CrossReference;
use App\Models\Bible\Verse;
use Illuminate\Console\Command;

class SeedCrossReferences extends Command
{
    protected $signature = 'bible:seed-cross-references';

    protected $description = 'Cria um conjunto inicial de referencias cruzadas para passagens biblicas conhecidas.';

    /**
     * @var array<int, array{source: string, target: string, relationship: string, notes: string}>
     */
    private array $references = [
        [
            'source' => 'Joao 3:16',
            'target' => 'Romanos 5:8',
            'relationship' => 'amor de Deus',
            'notes' => 'Romanos aprofunda o amor demonstrado por Deus em Cristo.',
        ],
        [
            'source' => 'Joao 3:16',
            'target' => '1 Joao 4:9',
            'relationship' => 'amor revelado',
            'notes' => 'Joao conecta o amor de Deus ao envio do Filho.',
        ],
        [
            'source' => 'Joao 3:16',
            'target' => '1 Joao 4:10',
            'relationship' => 'iniciativa divina',
            'notes' => 'A salvacao nasce da iniciativa amorosa de Deus.',
        ],
        [
            'source' => 'Salmos 23:1',
            'target' => 'Joao 10:11',
            'relationship' => 'pastor',
            'notes' => 'Jesus se apresenta como o bom Pastor anunciado na imagem pastoral das Escrituras.',
        ],
        [
            'source' => 'Isaias 53:5',
            'target' => '1 Pedro 2:24',
            'relationship' => 'cumprimento messianico',
            'notes' => 'Pedro aplica o sofrimento do Servo ao sacrifício de Cristo.',
        ],
    ];

    public function handle(): int
    {
        $created = 0;
        $skipped = 0;

        foreach ($this->references as $reference) {
            $source = Verse::query()->where('reference', $reference['source'])->first();
            $target = Verse::query()->where('reference', $reference['target'])->first();

            if (! $source || ! $target) {
                $skipped++;

                continue;
            }

            $crossReference = CrossReference::query()->firstOrCreate(
                [
                    'source_verse_id' => $source->id,
                    'target_verse_id' => $target->id,
                ],
                [
                    'relationship' => $reference['relationship'],
                    'notes' => $reference['notes'],
                ],
            );

            if ($crossReference->wasRecentlyCreated) {
                $created++;
            }
        }

        $this->components->info("Referencias cruzadas criadas: {$created}. Ignoradas por falta de versiculos: {$skipped}.");

        return self::SUCCESS;
    }
}
