<?php

namespace App\Http\Controllers\Bible;

use App\Http\Controllers\Controller;
use App\Http\Resources\StudyNoteResource;
use App\Models\Bible\StudyNote;
use App\Models\Bible\Verse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreStudyNoteController extends Controller
{
    public function __invoke(Request $request, Verse $verse): JsonResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'min:3', 'max:10000'],
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        $note = StudyNote::query()->create([
            'user_id' => $request->user()->id,
            'verse_id' => $verse->id,
            'title' => $validated['title'] ?? "Nota em {$verse->reference}",
            'body' => $validated['body'],
            'visibility' => 'private',
        ]);

        return response()->json([
            'note' => StudyNoteResource::make($note->load('verse.translation'))->resolve(),
            'stats' => [
                'notes' => StudyNote::query()->whereBelongsTo($request->user())->count(),
            ],
        ], 201);
    }
}
