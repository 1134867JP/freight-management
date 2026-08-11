<?php

namespace App\Models;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

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

    protected $hidden = [
        'api_key',
        'api_key_encrypted',
    ];

    public function getApiKeyAttribute(?string $legacyValue): ?string
    {
        $encrypted = $this->attributes['api_key_encrypted'] ?? null;

        if (filled($encrypted)) {
            try {
                return Crypt::decryptString($encrypted);
            } catch (DecryptException) {
                return null;
            }
        }

        return $legacyValue;
    }

    public function setApiKeyAttribute(?string $value): void
    {
        $this->attributes['api_key'] = null;
        $this->attributes['api_key_encrypted'] = filled($value)
            ? Crypt::encryptString($value)
            : null;
    }

    public function maskedApiKey(): ?string
    {
        if (blank($this->api_key)) {
            return null;
        }

        $visibleSuffix = mb_substr($this->api_key, -4);

        return str_repeat('•', 8).$visibleSuffix;
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function commands(): HasMany
    {
        return $this->hasMany(WhatsAppCommand::class);
    }
}
