<?php

namespace App\Http\Controllers\Ai;

use App\Http\Controllers\Controller;
use App\Http\Resources\AiAnswerResource;
use App\Jobs\RunBibleAgents;
use App\Services\Bible\BibleAgentOrchestrator;
use App\Services\OpenAI\MissingOpenAiKeyException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnswerQuestionController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question' => ['required', 'string', 'min:3', 'max:2000'],
        ]);

        if (! config('openai.api_key')) {
            return response()->json([
                'message' => 'OPENAI_API_KEY ainda nao esta configurada.',
            ], 422);
        }

        try {
            $answer = BibleAgentOrchestrator::default()->createPendingAnswer($validated['question']);
            RunBibleAgents::dispatch($answer->id);
        } catch (MissingOpenAiKeyException) {
            return response()->json([
                'message' => 'OPENAI_API_KEY ainda nao esta configurada.',
            ], 422);
        } catch (RequestException|ConnectionException) {
            return response()->json([
                'message' => 'Nao foi possivel consultar a OpenAI agora. Verifique a chave, saldo e conexao.',
            ], 502);
        }

        return response()->json([
            'answer' => AiAnswerResource::make($answer)->resolve(),
        ], 202);
    }
}
