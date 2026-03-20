<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Freight extends Model
{
    use BelongsToCompany;

    public const STATUS_LOADING = 'loading';

    public const STATUS_UNLOADING = 'unloading';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'company_id', 'user_id', 'timeslot_id', 'truck_id', 'operation_type', 'truck_plate', 'driver_name',
        'cargo_description', 'weight', 'gross_weight', 'net_weight',
        'status', 'admin_notes',
    ];

    protected $casts = [
        'weight' => 'decimal:2',
        'gross_weight' => 'decimal:2',
        'net_weight' => 'decimal:2',
    ];

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

    public function attachments(): HasMany
    {
        return $this->hasMany(FreightAttachment::class);
    }
}
