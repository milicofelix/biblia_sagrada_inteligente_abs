<?php

namespace App\Services\Bible;

use App\Models\Bible\Verse;
use Illuminate\Support\Carbon;

class AuthDailyPsalmResolver
{
    /**
     * @return array{reference: string, text: string, translation: string|null}
     */
    public function forDate(?Carbon $date = null): array
    {
        $date ??= now();

        $query = Verse::query()
            ->whereHas('book', fn ($query) => $query->where('name', 'Salmos'));

        $count = $query->count();

        if ($count === 0) {
            return $this->fallback();
        }

        $offset = ((int) $date->format('z')) % $count;
        $verse = $query
            ->with(['translation:id,abbreviation'])
            ->orderBy('id')
            ->skip($offset)
            ->first();

        return [
            'reference' => $verse->reference,
            'text' => $verse->text,
            'translation' => $verse->translation?->abbreviation,
        ];
    }

    /**
     * @return array{reference: string, text: string, translation: string|null}
     */
    private function fallback(): array
    {
        return [
            'reference' => 'Salmos 119:105',
            'text' => 'Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.',
            'translation' => null,
        ];
    }
}
