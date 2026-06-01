<?php

namespace App\Http\Controllers\Bible;

use App\Http\Controllers\Controller;
use App\Http\Resources\VerseFavoriteResource;
use App\Models\Bible\Verse;
use App\Models\Bible\VerseFavorite;
use Illuminate\Http\JsonResponse;

class ToggleVerseFavoriteController extends Controller
{
    public function __invoke(Verse $verse): JsonResponse
    {
        $favorite = VerseFavorite::query()
            ->whereNull('user_id')
            ->where('verse_id', $verse->id)
            ->first();

        if ($favorite) {
            $favorite->delete();

            return response()->json([
                'favorited' => false,
                'favorite' => null,
                'stats' => [
                    'favorites' => VerseFavorite::query()->count(),
                ],
            ]);
        }

        $favorite = VerseFavorite::query()->create([
            'verse_id' => $verse->id,
        ]);

        return response()->json([
            'favorited' => true,
            'favorite' => VerseFavoriteResource::make($favorite->load('verse.translation'))->resolve(),
            'stats' => [
                'favorites' => VerseFavorite::query()->count(),
            ],
        ], 201);
    }
}
