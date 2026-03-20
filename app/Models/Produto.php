<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Produto extends Model
{
    use Auditable, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'nome',
        'descricao',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function timeslots(): HasMany
    {
        return $this->hasMany(Timeslot::class);
    }

    public function freights(): HasMany
    {
        return $this->hasMany(Freight::class);
    }
}
