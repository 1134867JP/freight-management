<?php

namespace App\Models;

use App\Enums\FreightStatus;
use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Freight extends Model
{
    use Auditable, BelongsToCompany;

    public const STATUS_LOADING = 'loading';

    public const STATUS_UNLOADING = 'unloading';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'company_id', 'user_id', 'timeslot_id', 'produto_id', 'doca_id', 'truck_id', 'current_spot_id', 'operation_type',
        'truck_plate', 'driver_name', 'cargo_description', 'weight', 'gross_weight', 'net_weight',
        'status', 'admin_notes', 'arrived_at', 'departed_at',
        'qr_token', 'dwell_limit_minutos', 'detention_valor_hora',
    ];

    protected $casts = [
        'weight'               => 'decimal:2',
        'gross_weight'         => 'decimal:2',
        'net_weight'           => 'decimal:2',
        'detention_valor_hora' => 'decimal:2',
        'status'               => FreightStatus::class,
        'arrived_at'           => 'datetime',
        'departed_at'          => 'datetime',
    ];

    /**
     * Fretes que ocupam capacidade do timeslot (todos exceto cancelados).
     * Fonte única de verdade para contagem de capacidade — usar este scope
     * em vez de replicar whereNotIn('status', ['cancelled']) pelo código.
     */
    public function scopeOccupying(Builder $query): Builder
    {
        return $query->where('status', '!=', FreightStatus::Cancelled->value);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNotIn('status', [
            FreightStatus::Cancelled->value,
            FreightStatus::Completed->value,
        ]);
    }

    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where('status', FreightStatus::Cancelled->value);
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', FreightStatus::Completed->value);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function timeslot(): BelongsTo
    {
        return $this->belongsTo(Timeslot::class);
    }

    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    public function produto(): BelongsTo
    {
        return $this->belongsTo(Produto::class);
    }

    public function doca(): BelongsTo
    {
        return $this->belongsTo(Doca::class);
    }

    public function spot(): BelongsTo
    {
        return $this->belongsTo(YardSpot::class, 'current_spot_id');
    }

    public function moveOrders(): HasMany
    {
        return $this->hasMany(MoveOrder::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(FreightAttachment::class);
    }

    public function dwellMinutes(): ?int
    {
        if (! $this->arrived_at) {
            return null;
        }

        $end = $this->departed_at ?? now();

        return (int) $this->arrived_at->diffInMinutes($end);
    }

    public function isDetaining(): bool
    {
        if (! $this->dwell_limit_minutos || ! $this->arrived_at) {
            return false;
        }

        return ($this->dwellMinutes() ?? 0) > $this->dwell_limit_minutos;
    }

    public function detentionAmount(): float
    {
        if (! $this->isDetaining() || ! $this->detention_valor_hora) {
            return 0.0;
        }

        $extraMinutes = $this->dwellMinutes() - $this->dwell_limit_minutos;

        return round(($extraMinutes / 60) * $this->detention_valor_hora, 2);
    }

    protected static function booted(): void
    {
        static::creating(function (self $freight) {
            if (empty($freight->qr_token)) {
                $freight->qr_token = Str::random(40);
            }
        });
    }
}
