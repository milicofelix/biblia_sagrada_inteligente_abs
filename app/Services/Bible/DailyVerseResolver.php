<?php

namespace App\Services\Bible;

use App\Models\Bible\Verse;
use Illuminate\Support\Carbon;

class DailyVerseResolver
{
    public function forDate(?Carbon $date = null, ?int $translationId = null): ?Verse
    {
        $date ??= now();

        $query = Verse::query()
            ->when($translationId, fn ($query) => $query->where('translation_id', $translationId));

        $count = $query->count();

        if ($count === 0) {
            return null;
        }

        $offset = ((int) $date->format('z')) % $count;

        return $query
            ->with(['translation:id,abbreviation'])
            ->orderBy('id')
            ->skip($offset)
            ->first();
    }
}
