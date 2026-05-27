<?php

namespace App\Http\Controllers\Ai;

use App\Http\Controllers\Controller;
use App\Http\Resources\AiAnswerResource;
use App\Models\Bible\AiAnswer;
use Illuminate\Http\JsonResponse;

class ShowAnswerController extends Controller
{
    public function __invoke(AiAnswer $answer): JsonResponse
    {
        $answer->load(['question', 'agentRuns']);

        return response()->json([
            'answer' => AiAnswerResource::make($answer)->resolve(),
        ]);
    }
}
