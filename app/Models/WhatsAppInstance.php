<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsAppInstance extends Model
{
    protected $table = 'whatsapp_instances';

    protected $fillable = [
        'company_id',
        'name',
        'instance_name',
        'base_url',
        'api_key',
        'is_default',
        'is_active',
        'settings',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function commands(): HasMany
    {
        return $this->hasMany(WhatsAppCommand::class);
    }
}
