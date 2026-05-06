<?php

namespace App\Models;

use App\Enums\YardSpotStatus;
use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class YardSpot extends Model
{
    use Auditable, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'yard_zone_id',
        'nome',
        'status',
        'suporta_reefer',
        'suporta_oversized',
        'suporta_hazmat',
        'notas',
        'is_active',
    ];

    protected $casts = [
        'status'            => YardSpotStatus::class,
        'suporta_reefer'    => 'boolean',
        'suporta_oversized' => 'boolean',
        'suporta_hazmat'    => 'boolean',
        'is_active'         => 'boolean',
    ];

    public function zone(): BelongsTo
    {
        return $this->belongsTo(YardZone::class, 'yard_zone_id');
    }

    public function freights(): HasMany
    {
        return $this->hasMany(Freight::class, 'current_spot_id');
    }

    public function currentFreight(): ?Freight
    {
        return $this->freights()->active()->first();
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('status', YardSpotStatus::Available)->where('is_active', true);
    }

    public function isAvailable(): bool
    {
        return $this->status === YardSpotStatus::Available && $this->is_active;
    }
}
