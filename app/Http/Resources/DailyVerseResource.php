<?php

namespace App\Http\Resources;

use App\Models\Bible\Verse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Verse
 */
class DailyVerseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'text' => $this->text,
            'translation' => $this->translation?->abbreviation,
        ];
    }
}
