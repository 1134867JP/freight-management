<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class WhatsAppInstance extends Model
{
    use BelongsToCompany;

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
}
