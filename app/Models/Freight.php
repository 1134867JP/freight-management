<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Freight extends Model
{
    public const STATUS_LOADING = 'loading';

    public const STATUS_UNLOADING = 'unloading';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'user_id', 'timeslot_id', 'operation_type', 'truck_plate', 'driver_name',
        'cargo_description', 'weight', 'peso_bruto', 'peso_liquido',
        'nota_fiscal_path', 'attachment_path', 'status', 'admin_notes',
    ];

    protected $casts = [
        'weight' => 'decimal:2',
        'peso_bruto' => 'decimal:2',
        'peso_liquido' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function timeslot()
    {
        return $this->belongsTo(Timeslot::class);
    }
}
