<?php

namespace App\Models;

use App\Enums\DocaStatus;
use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Doca extends Model
{
    use Auditable, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'nome',
        'codigo',
        'descricao',
        'is_active',
        'status',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'status'    => DocaStatus::class,
    ];

    public function timeslots(): HasMany
    {
        return $this->hasMany(Timeslot::class);
    }

    public function freights(): HasMany
    {
        return $this->hasMany(Freight::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('status', DocaStatus::Available)->where('is_active', true);
    }

    public function isAvailable(): bool
    {
        return $this->status === DocaStatus::Available && $this->is_active;
    }
}
