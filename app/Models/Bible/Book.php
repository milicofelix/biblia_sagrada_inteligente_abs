<?php

namespace App\Models\Bible;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Book extends Model
{
    use HasFactory;

    protected $table = 'bible_books';

    protected $fillable = [
        'name',
        'abbreviation',
        'testament',
        'position',
        'chapters_count',
    ];

    public function chapters(): HasMany
    {
        return $this->hasMany(Chapter::class, 'book_id');
    }

    public function verses(): HasMany
    {
        return $this->hasMany(Verse::class, 'book_id');
    }
}
