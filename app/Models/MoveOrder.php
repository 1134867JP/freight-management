<?php

namespace App\Models;

use App\Enums\MoveOrderStatus;
use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MoveOrder extends Model
{
    use Auditable, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'freight_id',
        'yard_truck_id',
        'operador_id',
        'solicitado_por_id',
        'origem_tipo',
        'origem_id',
        'destino_tipo',
        'destino_id',
        'status',
        'notas',
        'iniciado_em',
        'concluido_em',
    ];

    protected $casts = [
        'status'       => MoveOrderStatus::class,
        'iniciado_em'  => 'datetime',
        'concluido_em' => 'datetime',
    ];

    public function freight(): BelongsTo
    {
        return $this->belongsTo(Freight::class);
    }

    public function yardTruck(): BelongsTo
    {
        return $this->belongsTo(YardTruck::class);
    }

    public function operador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operador_id');
    }

    public function solicitadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'solicitado_por_id');
    }

    public function origemModel(): ?Model
    {
        return match($this->origem_tipo) {
            'spot' => YardSpot::find($this->origem_id),
            'doca' => Doca::find($this->origem_id),
            default => null,
        };
    }

    public function destinoModel(): ?Model
    {
        return match($this->destino_tipo) {
            'spot' => YardSpot::find($this->destino_id),
            'doca' => Doca::find($this->destino_id),
            default => null,
        };
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', MoveOrderStatus::Pending);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', [MoveOrderStatus::Pending, MoveOrderStatus::InProgress]);
    }
}
