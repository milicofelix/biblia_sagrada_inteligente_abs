<?php

namespace App\Services\Bible;

use App\Models\Bible\Verse;
use Illuminate\Support\Carbon;

class DailyVerseResolver
{
    public function forDate(?Carbon $date = null): ?Verse
    {
        $date ??= now();

        $count = Verse::query()->count();

        if ($count === 0) {
            return null;
        }

        $offset = ((int) $date->format('z')) % $count;

        return Verse::query()
            ->with(['translation:id,abbreviation'])
            ->orderBy('id')
            ->skip($offset)
            ->first();
    }
}
