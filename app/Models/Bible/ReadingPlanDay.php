<?php

namespace App\Models\Bible;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadingPlanDay extends Model
{
    use HasFactory;

    protected $fillable = [
        'reading_plan_id',
        'day_number',
        'title',
        'reference',
        'start_verse_id',
        'end_verse_id',
        'completed_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(ReadingPlan::class, 'reading_plan_id');
    }

    public function startVerse(): BelongsTo
    {
        return $this->belongsTo(Verse::class, 'start_verse_id');
    }

    public function endVerse(): BelongsTo
    {
        return $this->belongsTo(Verse::class, 'end_verse_id');
    }
}
