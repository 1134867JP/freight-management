<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Timeslot extends Model
{
    protected $fillable = [
        'start_time',
        'end_time',
        'operation_type',
        'capacity',
        'current_reservations',
        'status',
        'description',
        'dropoff_address_id',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function dropoffAddress()
    {
        return $this->belongsTo(DropoffAddress::class);
    }

    public function freights()
    {
        return $this->hasMany(Freight::class);
    }

    // Relacionamento many-to-many com clientes (visibilidade)
    // Se vazio = PÚBLICO, se tem clientes = RESTRITO a esses clientes
    public function clients()
    {
        return $this->belongsToMany(User::class, 'client_timeslot', 'timeslot_id', 'user_id')
            ->where('role', 'client');
    }

    public function clampReservations(): void
    {
        if ($this->current_reservations < 0) {
            $this->current_reservations = 0;
        }

        if ($this->current_reservations >= $this->capacity) {
            $this->status = 'full';
        } elseif ($this->status === 'full') {
            $this->status = 'available';
        }
    }

    // Scope: Query de timeslots visíveis para um cliente
    // status != closed, current_reservations < capacity, (sem clientes OU tem cliente logado)
    public function scopeVisibleForClient($query, $userId)
    {
        return $query
            ->where('start_time', '>=', now())
            ->where('status', '!=', 'closed')
            ->whereColumn('current_reservations', '<', 'capacity')
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
        return $this->clients()->where('user_id', $userId)->exists();
    }
}
