<?php

namespace App\Models\Bible;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Verse extends Model
{
    use HasFactory;

    protected $table = 'bible_verses';

    protected $fillable = [
        'translation_id',
        'book_id',
        'chapter_id',
        'chapter_number',
        'verse_number',
        'reference',
        'text',
    ];

    public function translation(): BelongsTo
    {
        return $this->belongsTo(Translation::class, 'translation_id');
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class, 'book_id');
    }

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class, 'chapter_id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(StudyNote::class, 'verse_id');
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(VerseFavorite::class, 'verse_id');
    }

    public function outgoingCrossReferences(): HasMany
    {
        return $this->hasMany(CrossReference::class, 'source_verse_id');
    }

    public function incomingCrossReferences(): HasMany
    {
        return $this->hasMany(CrossReference::class, 'target_verse_id');
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        $driver = $query->getModel()->getConnection()->getDriverName();

        if ($driver === 'mysql') {
            return $query
                ->select('bible_verses.*')
                ->selectRaw('MATCH(reference, text) AGAINST (? IN NATURAL LANGUAGE MODE) as relevance', [$term])
                ->whereRaw('MATCH(reference, text) AGAINST (? IN NATURAL LANGUAGE MODE)', [$term])
                ->orderByDesc('relevance');
        }

        return $query->where(function (Builder $query) use ($term): void {
            $query
                ->where('reference', 'like', "%{$term}%")
                ->orWhere('text', 'like', "%{$term}%");
        });
    }
}
