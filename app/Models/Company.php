<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Company extends Model
{
    use HasFactory;

    public const DEFAULT_NAME = 'Empresa Padrão';

    public const DEFAULT_SLUG = 'default-company';

    protected $fillable = [
        'name',
        'slug',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public static function ensureDefault(): self
    {
        return static::query()->firstOrCreate(
            ['slug' => static::DEFAULT_SLUG],
            [
                'name' => static::DEFAULT_NAME,
                'is_active' => true,
            ],
        );
    }

    public function settings(): HasOne
    {
        return $this->hasOne(CompanySetting::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function companyAdmins(): HasMany
    {
        return $this->users()->where('role', User::ROLE_COMPANY_ADMIN);
    }

    public function timeslots(): HasMany
    {
        return $this->hasMany(Timeslot::class);
    }

    public function dropoffAddresses(): HasMany
    {
        return $this->hasMany(DropoffAddress::class);
    }

    public function freights(): HasMany
    {
        return $this->hasMany(Freight::class);
    }

    public function trucks(): HasMany
    {
        return $this->hasMany(Truck::class);
    }

    public function whatsappInstances(): HasMany
    {
        return $this->hasMany(WhatsAppInstance::class);
    }

    public function whatsappInstance(): HasOne
    {
        return $this->hasOne(WhatsAppInstance::class);
    }
}
