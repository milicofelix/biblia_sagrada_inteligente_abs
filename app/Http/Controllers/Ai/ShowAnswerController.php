<?php

namespace App\Http\Controllers\Ai;

use App\Http\Controllers\Controller;
use App\Http\Resources\AiAnswerResource;
use App\Models\Bible\AiAnswer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShowAnswerController extends Controller
{
    public function __invoke(Request $request, AiAnswer $answer): JsonResponse
    {
        abort_unless($answer->question()->whereBelongsTo($request->user())->exists(), 403);

        $answer->load(['question', 'agentRuns']);

        return response()->json([
            'answer' => AiAnswerResource::make($answer)->resolve(),
        ]);
    }
}
