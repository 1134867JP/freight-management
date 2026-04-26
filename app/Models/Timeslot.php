<?php

namespace App\Models;

use App\Enums\FreightStatus;
use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use App\Models\Doca;
use App\Models\Produto;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Timeslot extends Model
{
    use Auditable, BelongsToCompany;

    public const STATUS_AVAILABLE = 'available';

    public const STATUS_FULL = 'full';

    public const STATUS_CLOSED = 'closed';

    public const MODELO_ABERTA = 'aberta';

    public const MODELO_POR_PRODUTO = 'por_produto';

    public const MODELO_POR_PRODUTO_DOCA = 'por_produto_doca';

    protected $fillable = [
        'company_id',
        'start_time',
        'end_time',
        'operation_type',
        'capacity',
        'status',
        'description',
        'modelo',
        'produto_id',
        'doca_id',
        'dropoff_address_id',
        'created_by',
    ];

    // Não usar $appends aqui: adicionaria current_reservations a toda serialização
    // de Timeslot, disparando uma query COUNT por registro (N+1).
    // Use sempre ->withCount(['freights as current_reservations' => ...]) nas queries de listagem.
    // O accessor abaixo existe para lógica de negócio (ex: validação de capacidade no update).
    protected $appends = [];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function getCurrentReservationsAttribute(): int
    {
        if (array_key_exists('current_reservations', $this->attributes)) {
            return (int) $this->attributes['current_reservations'];
        }

        // Fallback live-count — aceitável em lógica de negócio pontual (ex: validação de capacidade).
        // Nunca chamar em listagens: usar withCount(['freights as current_reservations' => occupying]).
        return $this->freights()->occupying()->count();
    }

    public function dropoffAddress(): BelongsTo
    {
        return $this->belongsTo(DropoffAddress::class);
    }

    public function produto(): BelongsTo
    {
        return $this->belongsTo(Produto::class);
    }

    public function doca(): BelongsTo
    {
        return $this->belongsTo(Doca::class);
    }

    public function freights(): HasMany
    {
        return $this->hasMany(Freight::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Relacionamento many-to-many com clientes (visibilidade)
    // Se vazio = PÚBLICO, se tem clientes = RESTRITO a esses clientes
    public function clients(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'client_timeslot', 'timeslot_id', 'user_id')
            ->where('role', User::ROLE_CLIENT);
    }

    public function clampReservations(): void
    {
        $count = $this->freights()->occupying()->count();

        if ($count >= $this->capacity) {
            $this->status = self::STATUS_FULL;
        } elseif ($this->status === self::STATUS_FULL) {
            $this->status = self::STATUS_AVAILABLE;
        }
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->where('status', '!=', self::STATUS_CLOSED)
            ->where('end_time', '>=', now());
    }

    // Scope: Query de timeslots visíveis para um cliente
    // status != closed, active_reservations < capacity, (sem clientes OU tem cliente logado)
    public function scopeVisibleForClient($query, $userId)
    {
        return $query
            ->where('end_time', '>=', now())
            ->where('status', '!=', self::STATUS_CLOSED)
            ->whereRaw(
                '(SELECT COUNT(*) FROM freights WHERE freights.timeslot_id = timeslots.id AND freights.status != ?) < timeslots.capacity',
                [FreightStatus::Cancelled->value]
            )
            ->where(function ($q) use ($userId) {
                // Público: sem clientes vinculados
                $q->whereDoesntHave('clients')
                  // OU Restrito: cliente logado está na lista
                    ->orWhereHas('clients', function ($cl) use ($userId) {
                        $cl->where('users.id', $userId);
                    });
            });
    }

    // Helper: verifica se timeslot é visível para um cliente
    public function isVisibleTo($userId): bool
    {
        // Se não tem clientes associados = PÚBLICO (todos veem)
        if ($this->clients()->count() === 0) {
            return true;
        }

        // Se tem clientes = RESTRITO (só os listados veem)
        return $this->clients()->where('users.id', $userId)->exists();
    }
}
