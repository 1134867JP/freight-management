<?php

namespace App\Models;

use App\Enums\YardZoneType;
use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class YardZone extends Model
{
    use Auditable, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'nome',
        'codigo',
        'tipo',
        'descricao',
        'is_active',
        'ordem',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'tipo'      => YardZoneType::class,
        'ordem'     => 'integer',
    ];

    public function spots(): HasMany
    {
        return $this->hasMany(YardSpot::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
