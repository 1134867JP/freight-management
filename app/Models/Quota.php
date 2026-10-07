<?php

namespace App\Models;

use App\Enums\FreightStatus;
use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Cota publicada pela empresa: N cargas de um produto para um destino,
 * distribuídas em horários dentro de um período. Cada agendamento (Freight)
 * consome uma unidade.
 */
class Quota extends Model
{
    use Auditable, BelongsToCompany;

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_CLOSED = 'closed';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'company_id',
        'produto_id',
        'product_name',
        'destination',
        'operation_type',
        'total_quantity',
        'starts_on',
        'ends_on',
        'hours',
        'slot_capacity',
        'expected_weight_kg',
        'max_per_client',
        'rules',
        'requires_invoice',
        'requires_weight_ticket',
        'status',
        'notified_at',
        'created_by',
    ];

    protected $casts = [
        'starts_on' => 'date',
        'ends_on' => 'date',
        'hours' => 'array',
        'total_quantity' => 'integer',
        'slot_capacity' => 'integer',
        'max_per_client' => 'integer',
        'expected_weight_kg' => 'decimal:2',
        'requires_invoice' => 'boolean',
        'requires_weight_ticket' => 'boolean',
        'notified_at' => 'datetime',
    ];

    public function produto(): BelongsTo
    {
        return $this->belongsTo(Produto::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function timeslots(): HasMany
    {
        return $this->hasMany(Timeslot::class);
    }

    public function freights(): HasMany
    {
        return $this->hasMany(Freight::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(QuotaAllocation::class);
    }

    public function clients(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'quota_allocations')
            ->withPivot('quantity')
            ->withTimestamps();
    }

    public function getCodeAttribute(): string
    {
        return 'COT-'.str_pad((string) $this->getKey(), 4, '0', STR_PAD_LEFT);
    }

    public function isRestricted(): bool
    {
        return $this->allocations()->exists();
    }

    public function isExpired(): bool
    {
        return $this->ends_on !== null && $this->ends_on->copy()->endOfDay()->isPast();
    }

    public function isBookable(): bool
    {
        return $this->status === self::STATUS_PUBLISHED && ! $this->isExpired();
    }

    /** Cotas abertas a novos agendamentos. */
    public function scopeOpen(Builder $query): Builder
    {
        return $query
            ->where('status', self::STATUS_PUBLISHED)
            ->whereDate('ends_on', '>=', now()->toDateString());
    }

    /** Cotas abertas que o cliente pode enxergar (públicas ou alocadas a ele). */
    public function scopeBookableBy(Builder $query, int $userId): Builder
    {
        return $query
            ->open()
            ->where(function (Builder $query) use ($userId): void {
                $query->whereDoesntHave('allocations')
                    ->orWhereHas('allocations', fn (Builder $allocation) => $allocation->where('user_id', $userId));
            });
    }

    /**
     * Contagens por estágio do ciclo, numa única query por cota listada.
     */
    public function scopeWithUsage(Builder $query): Builder
    {
        return $query->withCount([
            'freights as booked_count' => fn (Builder $q) => $q->where('status', FreightStatus::Reserved->value),
            'freights as in_operation_count' => fn (Builder $q) => $q->whereIn('status', [
                FreightStatus::Arrived->value,
                FreightStatus::Loading->value,
                FreightStatus::Unloading->value,
            ]),
            'freights as completed_count' => fn (Builder $q) => $q->where('status', FreightStatus::Completed->value),
            'freights as no_show_count' => fn (Builder $q) => $q->where('status', FreightStatus::NoShow->value),
            'freights as cancelled_count' => fn (Builder $q) => $q->where('status', FreightStatus::Cancelled->value),
        ]);
    }

    /** Unidades consumidas (agendadas, em operação ou concluídas). */
    public function occupiedUnits(): int
    {
        if (array_key_exists('booked_count', $this->attributes)) {
            return (int) $this->booked_count + (int) $this->in_operation_count + (int) $this->completed_count;
        }

        return $this->freights()->occupying()->count();
    }

    public function remainingUnits(): int
    {
        return max((int) $this->total_quantity - $this->occupiedUnits(), 0);
    }

    /**
     * Estado da cota como um todo, derivado de forma determinística.
     *
     * @return array{key: string, label: string, tone: string}
     */
    public function lifecycle(): array
    {
        if ($this->status === self::STATUS_CANCELLED) {
            return ['key' => 'cancelled', 'label' => 'Cancelada', 'tone' => 'danger'];
        }

        if ($this->status === self::STATUS_CLOSED) {
            return ['key' => 'closed', 'label' => 'Encerrada', 'tone' => 'neutral'];
        }

        if ($this->isExpired()) {
            return ['key' => 'expired', 'label' => 'Expirada', 'tone' => 'neutral'];
        }

        if ($this->remainingUnits() === 0) {
            return ['key' => 'sold_out', 'label' => 'Esgotada', 'tone' => 'info'];
        }

        if ($this->starts_on->isFuture()) {
            return ['key' => 'scheduled', 'label' => 'Publicada', 'tone' => 'violet'];
        }

        return ['key' => 'open', 'label' => 'Aberta', 'tone' => 'success'];
    }

    /**
     * Quantas unidades este cliente ainda pode agendar nesta cota.
     * Considera saldo geral, alocação do cliente e limite por cliente.
     */
    public function availableFor(User $user, ?int $usedByClient = null): int
    {
        if (! $this->isBookable()) {
            return 0;
        }

        $usedByClient ??= $this->freights()->occupying()->where('user_id', $user->id)->count();
        $available = $this->remainingUnits();

        $allocations = $this->relationLoaded('allocations')
            ? $this->allocations
            : $this->allocations()->get();

        if ($allocations->isNotEmpty()) {
            $allocation = $allocations->firstWhere('user_id', $user->id);

            if (! $allocation) {
                return 0;
            }

            if ($allocation->quantity !== null) {
                $available = min($available, (int) $allocation->quantity - $usedByClient);
            }
        }

        if ($this->max_per_client !== null) {
            $available = min($available, (int) $this->max_per_client - $usedByClient);
        }

        return max($available, 0);
    }

    /** @return list<CarbonImmutable> */
    public function days(): array
    {
        $days = [];
        $cursor = CarbonImmutable::parse($this->starts_on)->startOfDay();
        $last = CarbonImmutable::parse($this->ends_on)->startOfDay();

        while ($cursor->lte($last)) {
            $days[] = $cursor;
            $cursor = $cursor->addDay();
        }

        return $days;
    }

    public function operationLabel(): string
    {
        return $this->operation_type === 'unload' ? 'Descarga' : 'Carga';
    }
}
