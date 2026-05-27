<?php

namespace App\Models\Bible;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Translation extends Model
{
    use HasFactory;

    protected $table = 'bible_translations';

    protected $fillable = [
        'name',
        'abbreviation',
        'language',
        'source',
        'copyright',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    public function verses(): HasMany
    {
        return $this->hasMany(Verse::class, 'translation_id');
    }
}
