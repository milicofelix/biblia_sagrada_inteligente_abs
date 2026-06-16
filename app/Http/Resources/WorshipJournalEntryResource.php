<?php

namespace App\Http\Resources;

use App\Models\Bible\WorshipJournalEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin WorshipJournalEntry
 */
class WorshipJournalEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'worshipDate' => $this->worship_date?->toDateString(),
            'formattedDate' => $this->worship_date?->format('d/m/Y'),
            'passageReference' => $this->passage_reference,
            'title' => $this->title,
            'churchName' => $this->church_name,
            'preacherName' => $this->preacher_name,
            'personalNotes' => $this->personal_notes,
            'passage' => $this->passage ?? [],
            'aiStudy' => $this->ai_study,
            'status' => $this->status,
            'error' => $this->error,
            'generatedAt' => $this->generated_at?->toISOString(),
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
