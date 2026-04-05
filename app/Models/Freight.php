<?php

namespace App\Models;

use App\Enums\FreightStatus;
use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Freight extends Model
{
    use Auditable, BelongsToCompany;

    public const STATUS_LOADING = 'loading';

    public const STATUS_UNLOADING = 'unloading';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'company_id', 'user_id', 'timeslot_id', 'produto_id', 'doca_id', 'truck_id', 'operation_type',
        'truck_plate', 'driver_name', 'cargo_description', 'weight', 'gross_weight', 'net_weight',
        'status', 'admin_notes', 'arrived_at', 'departed_at',
    ];

    protected $casts = [
        'weight'       => 'decimal:2',
        'gross_weight' => 'decimal:2',
        'net_weight'   => 'decimal:2',
        'status'       => FreightStatus::class,
        'arrived_at'   => 'datetime',
        'departed_at'  => 'datetime',
    ];

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

    public function attachments(): HasMany
    {
        return $this->hasMany(FreightAttachment::class);
    }
}
