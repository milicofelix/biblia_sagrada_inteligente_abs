<?php

namespace App\Models\Bible;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chapter extends Model
{
    use HasFactory;

    protected $table = 'bible_chapters';

    protected $fillable = [
        'book_id',
        'number',
        'summary',
    ];

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class, 'book_id');
    }

    public function verses(): HasMany
    {
        return $this->hasMany(Verse::class, 'chapter_id');
    }
}
