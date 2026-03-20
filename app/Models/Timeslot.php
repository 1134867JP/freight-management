<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Timeslot extends Model
{
    use BelongsToCompany;

    public const STATUS_AVAILABLE = 'available';

    public const STATUS_FULL = 'full';

    public const STATUS_CLOSED = 'closed';

    protected $fillable = [
        'company_id',
        'start_time',
        'end_time',
        'operation_type',
        'capacity',
        'status',
        'description',
        'dropoff_address_id',
        'created_by',
    ];

    protected $appends = ['current_reservations'];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function getCurrentReservationsAttribute(): int
    {
        return $this->freights()->whereNotIn('status', ['cancelled'])->count();
    }

    public function dropoffAddress(): BelongsTo
    {
        return $this->belongsTo(DropoffAddress::class);
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
        $count = $this->freights()->whereNotIn('status', ['cancelled'])->count();

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
                "(SELECT COUNT(*) FROM freights WHERE freights.timeslot_id = timeslots.id AND freights.status NOT IN ('cancelled')) < timeslots.capacity"
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
