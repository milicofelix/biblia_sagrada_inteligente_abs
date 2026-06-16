<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Bible\AiQuestion;
use App\Models\Bible\ReadingPlan;
use App\Models\Bible\StudyNote;
use App\Models\Bible\VerseFavorite;
use App\Models\Bible\WorshipJournalEntry;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function aiQuestions(): HasMany
    {
        return $this->hasMany(AiQuestion::class);
    }

    public function readingPlans(): HasMany
    {
        return $this->hasMany(ReadingPlan::class);
    }

    public function studyNotes(): HasMany
    {
        return $this->hasMany(StudyNote::class);
    }

    public function verseFavorites(): HasMany
    {
        return $this->hasMany(VerseFavorite::class);
    }

    public function worshipJournalEntries(): HasMany
    {
        return $this->hasMany(WorshipJournalEntry::class);
    }

    public function setting(): HasOne
    {
        return $this->hasOne(UserSetting::class);
    }
}
