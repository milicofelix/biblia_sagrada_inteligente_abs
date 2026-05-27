<?php

namespace App\Models\Bible;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class AiQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'verse_id',
        'question',
        'intent',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verse(): BelongsTo
    {
        return $this->belongsTo(Verse::class, 'verse_id');
    }

    public function answer(): HasOne
    {
        return $this->hasOne(AiAnswer::class, 'question_id');
    }
}
