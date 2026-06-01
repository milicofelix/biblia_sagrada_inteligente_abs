<?php

namespace App\Http\Controllers\Bible;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReadingPlanResource;
use App\Models\Bible\ReadingPlanDay;
use Illuminate\Http\JsonResponse;

class CompleteReadingPlanDayController extends Controller
{
    public function __invoke(ReadingPlanDay $day): JsonResponse
    {
        if ($day->completed_at === null) {
            $day->forceFill(['completed_at' => now()])->save();
        }

        return response()->json([
            'plan' => ReadingPlanResource::make(
                $day->plan->load(['days' => fn ($query) => $query->orderBy('day_number')])
            )->resolve(),
        ]);
    }
}
