<?php

namespace App\Models\Bible;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_id',
        'model',
        'answer',
        'citations',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'citations' => 'array',
            'metadata' => 'array',
        ];
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(AiQuestion::class, 'question_id');
    }

    public function agentRuns(): HasMany
    {
        return $this->hasMany(AgentRun::class, 'answer_id');
    }
}
