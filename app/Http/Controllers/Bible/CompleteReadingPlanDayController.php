<?php

namespace App\Http\Controllers\Bible;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReadingPlanResource;
use App\Models\Bible\ReadingPlanDay;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompleteReadingPlanDayController extends Controller
{
    public function __invoke(Request $request, ReadingPlanDay $day): JsonResponse
    {
        abort_unless($day->plan()->whereBelongsTo($request->user())->exists(), 403);

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
