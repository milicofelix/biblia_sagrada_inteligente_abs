<?php

namespace App\Models\Bible;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrossReference extends Model
{
    use HasFactory;

    protected $table = 'bible_cross_references';

    protected $fillable = [
        'source_verse_id',
        'target_verse_id',
        'relationship',
        'notes',
    ];

    public function sourceVerse(): BelongsTo
    {
        return $this->belongsTo(Verse::class, 'source_verse_id');
    }

    public function targetVerse(): BelongsTo
    {
        return $this->belongsTo(Verse::class, 'target_verse_id');
    }
}
