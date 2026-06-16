<?php

namespace App\Http\Controllers;

use App\Models\Bible\Translation;
use App\Models\Bible\Verse;
use App\Services\UserSettingsResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function edit(Request $request, UserSettingsResolver $settingsResolver): Response
    {
        $settings = $settingsResolver->forUser($request->user());

        return Inertia::render('Settings', [
            'stats' => [
                'verses' => Verse::query()->count(),
            ],
            'settings' => [
                'translationId' => $settings->translation_id,
                'initialReference' => $settings->initial_reference,
                'theme' => $settings->theme,
                'notificationsEnabled' => $settings->notifications_enabled,
            ],
            'translations' => Translation::query()
                ->orderByDesc('is_default')
                ->orderBy('name')
                ->get(['id', 'name', 'abbreviation'])
                ->map(fn (Translation $translation): array => [
                    'id' => $translation->id,
                    'name' => $translation->name,
                    'abbreviation' => $translation->abbreviation,
                ])
                ->all(),
        ]);
    }

    public function update(Request $request, UserSettingsResolver $settingsResolver): RedirectResponse
    {
        $validated = $request->validate([
            'translation_id' => ['nullable', 'integer', Rule::exists('bible_translations', 'id')],
            'initial_reference' => ['required', 'string', 'max:120'],
            'theme' => ['required', Rule::in(['light', 'night'])],
            'notifications_enabled' => ['required', 'boolean'],
        ]);

        $settingsResolver->forUser($request->user())->update($validated);

        return back()->with('status', 'settings-updated');
    }
}
