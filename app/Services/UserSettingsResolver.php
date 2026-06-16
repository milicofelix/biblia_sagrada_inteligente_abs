<?php

namespace App\Services;

use App\Models\Bible\Translation;
use App\Models\User;
use App\Models\UserSetting;

class UserSettingsResolver
{
    public function forUser(User $user): UserSetting
    {
        return $user->setting()->firstOrCreate([], [
            'translation_id' => $this->defaultTranslationId(),
            'initial_reference' => 'Joao 3:16',
            'theme' => 'light',
            'notifications_enabled' => true,
        ]);
    }

    public function preferredTranslationId(UserSetting $settings): ?int
    {
        return $settings->translation_id ?? $this->defaultTranslationId();
    }

    public function defaultTranslationId(): ?int
    {
        return Translation::query()
            ->where('is_default', true)
            ->value('id')
            ?? Translation::query()->value('id');
    }
}
