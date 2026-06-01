<?php

namespace App\Http\Resources;

use App\Models\Bible\VerseFavorite;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin VerseFavorite
 */
class VerseFavoriteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'verseId' => $this->verse_id,
            'reference' => $this->verse?->reference,
            'text' => $this->verse?->text,
            'translation' => $this->verse?->translation?->abbreviation,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
