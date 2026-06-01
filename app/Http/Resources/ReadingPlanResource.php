<?php

namespace App\Http\Resources;

use App\Models\Bible\ReadingPlan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ReadingPlan
 */
class ReadingPlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $days = $this->days->sortBy('day_number')->values();
        $completedDays = $days->whereNotNull('completed_at')->count();
        $currentDay = $days->firstWhere('completed_at', null) ?? $days->last();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'daysCount' => $this->days_count,
            'completedDays' => $completedDays,
            'progressPercent' => $this->days_count > 0 ? round(($completedDays / $this->days_count) * 100) : 0,
            'currentDay' => $currentDay ? [
                'id' => $currentDay->id,
                'dayNumber' => $currentDay->day_number,
                'title' => $currentDay->title,
                'reference' => $currentDay->reference,
                'completedAt' => $currentDay->completed_at?->toISOString(),
            ] : null,
        ];
    }
}
