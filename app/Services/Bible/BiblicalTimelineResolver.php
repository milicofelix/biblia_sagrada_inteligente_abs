<?php

namespace App\Services\Bible;

use App\Models\Bible\Verse;

class BiblicalTimelineResolver
{
    /**
     * @var array<int, array{key: string, title: string, period: string, summary: string, range: array{int, int}}>
     */
    private array $phases = [
        [
            'key' => 'torah',
            'title' => 'Fundamentos da Alianca',
            'period' => 'Criacao, patriarcas, exodo e formacao de Israel',
            'summary' => 'Mostra as origens, a promessa feita aos patriarcas, a libertacao do Egito e a entrega da Lei.',
            'range' => [1, 5],
        ],
        [
            'key' => 'land-and-kingdom',
            'title' => 'Terra, Juizes e Reino',
            'period' => 'Conquista, juizes, monarquia e divisao do reino',
            'summary' => 'Acompanha Israel entrando na terra, vivendo ciclos de infidelidade e formando sua monarquia.',
            'range' => [6, 17],
        ],
        [
            'key' => 'wisdom',
            'title' => 'Sabedoria e Louvor',
            'period' => 'Reflexao, adoracao e vida diante de Deus',
            'summary' => 'Reune poesia, oracao, sabedoria pratica e meditacao sobre sofrimento, temor do Senhor e fidelidade.',
            'range' => [18, 22],
        ],
        [
            'key' => 'prophets',
            'title' => 'Profetas, Exilio e Esperanca',
            'period' => 'Advertencia, juizo, exilio, retorno e promessa messianica',
            'summary' => 'Os profetas chamam o povo ao arrependimento e apontam para restauracao, nova alianca e esperança futura.',
            'range' => [23, 39],
        ],
        [
            'key' => 'gospels',
            'title' => 'Jesus, Reino e Evangelho',
            'period' => 'Vida, ministerio, morte e ressurreicao de Jesus',
            'summary' => 'Os Evangelhos apresentam Jesus como cumprimento das promessas e centro da historia biblica.',
            'range' => [40, 43],
        ],
        [
            'key' => 'church',
            'title' => 'Igreja Primitiva e Epistolas',
            'period' => 'Expansao da igreja, doutrina e vida comunitaria',
            'summary' => 'Mostra a igreja anunciando Cristo, formando comunidades e aplicando o evangelho a fe e pratica.',
            'range' => [44, 65],
        ],
        [
            'key' => 'consummation',
            'title' => 'Consumacao e Esperanca Final',
            'period' => 'Perseveranca, juizo, nova criacao e reino consumado',
            'summary' => 'Apocalipse consola a igreja perseguida e aponta para a vitoria final de Deus.',
            'range' => [66, 66],
        ],
    ];

    public function forVerse(Verse $verse): ?array
    {
        $book = $verse->book;

        if (! $book) {
            return null;
        }

        $position = (int) $book->position;
        $phaseIndex = collect($this->phases)
            ->search(fn (array $phase): bool => $position >= $phase['range'][0] && $position <= $phase['range'][1]);

        if ($phaseIndex === false) {
            return null;
        }

        $phase = $this->phases[$phaseIndex];

        return [
            'book' => $book->name,
            'testament' => $book->testament === 'old' ? 'Antigo Testamento' : 'Novo Testamento',
            'chapter' => $verse->chapter_number,
            'verse' => $verse->verse_number,
            'phase' => [
                'key' => $phase['key'],
                'title' => $phase['title'],
                'period' => $phase['period'],
                'summary' => $phase['summary'],
                'position' => $phaseIndex + 1,
                'total' => count($this->phases),
            ],
            'previousPhase' => $this->phaseSummary($phaseIndex - 1),
            'nextPhase' => $this->phaseSummary($phaseIndex + 1),
        ];
    }

    private function phaseSummary(int $index): ?array
    {
        if (! isset($this->phases[$index])) {
            return null;
        }

        return [
            'title' => $this->phases[$index]['title'],
            'period' => $this->phases[$index]['period'],
        ];
    }
}
