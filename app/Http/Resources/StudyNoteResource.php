<?php

namespace App\Http\Resources;

use App\Models\Bible\StudyNote;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin StudyNote
 */
class StudyNoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'verseId' => $this->verse_id,
            'reference' => $this->verse?->reference,
            'translation' => $this->verse?->translation?->abbreviation,
            'title' => $this->title,
            'body' => $this->body,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
