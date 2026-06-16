<?php

namespace App\Http\Controllers;

use App\Http\Resources\WorshipJournalEntryResource;
use App\Jobs\GenerateWorshipJournalStudy;
use App\Models\Bible\Verse;
use App\Models\Bible\WorshipJournalEntry;
use App\Services\UserSettingsResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorshipJournalController extends Controller
{
    public function index(Request $request, UserSettingsResolver $settingsResolver): Response
    {
        $settings = $settingsResolver->forUser($request->user());

        return Inertia::render('WorshipJournal', [
            'stats' => [
                'verses' => Verse::query()->count(),
            ],
            'settings' => [
                'theme' => $settings->theme,
            ],
            'entries' => WorshipJournalEntryResource::collection(
                WorshipJournalEntry::query()
                    ->whereBelongsTo($request->user())
                    ->latest('worship_date')
                    ->latest()
                    ->limit(20)
                    ->get()
            )->resolve(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if (! config('openai.api_key')) {
            return back()->withErrors([
                'passage_reference' => 'OPENAI_API_KEY ainda nao esta configurada.',
            ]);
        }

        $validated = $request->validate([
            'worship_date' => ['required', 'date'],
            'passage_reference' => ['required', 'string', 'max:160'],
            'title' => ['nullable', 'string', 'max:255'],
            'church_name' => ['nullable', 'string', 'max:255'],
            'preacher_name' => ['nullable', 'string', 'max:255'],
            'personal_notes' => ['nullable', 'string', 'max:10000'],
        ]);

        $entry = WorshipJournalEntry::query()->create([
            'user_id' => $request->user()->id,
            'worship_date' => $validated['worship_date'],
            'passage_reference' => $this->normalizeReference($validated['passage_reference']),
            'title' => $validated['title'] ?? null,
            'church_name' => $validated['church_name'] ?? null,
            'preacher_name' => $validated['preacher_name'] ?? null,
            'personal_notes' => $validated['personal_notes'] ?? null,
            'status' => 'queued',
        ]);

        GenerateWorshipJournalStudy::dispatch($entry->id);

        return redirect()
            ->route('worship-journal.index')
            ->with('status', 'worship-journal-created');
    }

    public function show(Request $request, WorshipJournalEntry $entry): JsonResponse
    {
        abort_unless($entry->user_id === $request->user()->id, 403);

        return response()->json([
            'entry' => WorshipJournalEntryResource::make($entry)->resolve(),
        ]);
    }

    private function normalizeReference(string $reference): string
    {
        $reference = trim(preg_replace('/\s+/', ' ', $reference) ?? $reference);

        return preg_replace('/(\d+)\s*,\s*(\d+)/', '$1:$2', $reference) ?? $reference;
    }
}
