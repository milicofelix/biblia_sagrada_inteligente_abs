<?php

namespace App\Models\Bible;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerseFavorite extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'verse_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verse(): BelongsTo
    {
        return $this->belongsTo(Verse::class, 'verse_id');
    }
}
