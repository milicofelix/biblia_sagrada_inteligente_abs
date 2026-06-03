<?php

namespace App\Http\Controllers\Bible;

use App\Http\Controllers\Controller;
use App\Http\Resources\VerseFavoriteResource;
use App\Models\Bible\Verse;
use App\Models\Bible\VerseFavorite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ToggleVerseFavoriteController extends Controller
{
    public function __invoke(Request $request, Verse $verse): JsonResponse
    {
        $favorite = VerseFavorite::query()
            ->whereBelongsTo($request->user())
            ->where('verse_id', $verse->id)
            ->first();

        if ($favorite) {
            $favorite->delete();

            return response()->json([
                'favorited' => false,
                'favorite' => null,
                'stats' => [
                    'favorites' => VerseFavorite::query()->whereBelongsTo($request->user())->count(),
                ],
            ]);
        }

        $favorite = VerseFavorite::query()->create([
            'user_id' => $request->user()->id,
            'verse_id' => $verse->id,
        ]);

        return response()->json([
            'favorited' => true,
            'favorite' => VerseFavoriteResource::make($favorite->load('verse.translation'))->resolve(),
            'stats' => [
                'favorites' => VerseFavorite::query()->whereBelongsTo($request->user())->count(),
            ],
        ], 201);
    }
}
