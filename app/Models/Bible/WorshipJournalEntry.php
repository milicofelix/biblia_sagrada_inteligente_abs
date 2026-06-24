<?php

namespace App\Models\Bible;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorshipJournalEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'verse_id',
        'worship_date',
        'passage_reference',
        'title',
        'church_name',
        'preacher_name',
        'personal_notes',
        'passage',
        'ai_study',
        'status',
        'progress_percent',
        'progress_step',
        'progress_message',
        'error',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'worship_date' => 'date',
            'passage' => 'array',
            'generated_at' => 'datetime',
            'progress_percent' => 'integer',
        ];
    }

    /**
     * Atualiza o progresso real do processamento para o frontend acompanhar.
     */
    public function markProgress(int $percent, string $step, string $message, ?string $status = null): void
    {
        $this->forceFill([
            'status' => $status ?? $this->status,
            'progress_percent' => max(0, min(100, $percent)),
            'progress_step' => $step,
            'progress_message' => $message,
        ])->save();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verse(): BelongsTo
    {
        return $this->belongsTo(Verse::class, 'verse_id');
    }
}
