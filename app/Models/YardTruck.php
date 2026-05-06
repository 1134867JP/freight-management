<?php

namespace App\Models;

use App\Enums\YardTruckStatus;
use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class YardTruck extends Model
{
    use Auditable, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'identificador',
        'modelo',
        'status',
        'operador_id',
        'is_active',
        'notas',
    ];

    protected $casts = [
        'status'    => YardTruckStatus::class,
        'is_active' => 'boolean',
    ];

    public function operador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operador_id');
    }

    public function moveOrders(): HasMany
    {
        return $this->hasMany(MoveOrder::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('status', YardTruckStatus::Available)->where('is_active', true);
    }
}
