<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DropoffAddress extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'company_id',
        'name',        // nome/identificador (ex.: "Pátio A")
        'street',      // logradouro
        'number',      // número
        'neighborhood', // bairro
        'city',        // cidade
        'state',       // UF
        'complement',  // complemento (opcional)
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function timeslots(): HasMany
    {
        return $this->hasMany(Timeslot::class);
    }

    // Helper para exibir endereço formatado
    public function getFormattedAddressAttribute(): string
    {
        $parts = [
            $this->street,
            $this->number,
            $this->complement ? "({$this->complement})" : null,
            $this->neighborhood,
            $this->city,
            $this->state,
        ];

        return implode(', ', array_filter($parts));
    }
}
