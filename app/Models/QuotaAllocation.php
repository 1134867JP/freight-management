<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Restringe uma cota a um cliente. Sem nenhuma alocação a cota é pública;
 * `quantity` nulo significa que o cliente usa o saldo geral da cota.
 */
class QuotaAllocation extends Model
{
    protected $fillable = [
        'quota_id',
        'user_id',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function quota(): BelongsTo
    {
        return $this->belongsTo(Quota::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }
}
