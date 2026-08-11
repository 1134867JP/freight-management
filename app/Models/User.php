<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\Concerns\Auditable;
use App\Models\Concerns\BelongsToCompany;
use App\Support\WhatsAppPhone;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use Auditable, BelongsToCompany, HasFactory, Notifiable, SoftDeletes;

    public const ROLE_PLATFORM_ADMIN = 'platform_admin';

    public const ROLE_COMPANY_ADMIN = 'company_admin';

    public const ROLE_COMPANY_EMPLOYEE = 'company_employee';

    public const ROLE_CLIENT = 'client';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'company_id',
        'name',
        'email',
        'whatsapp_phone',
        'password',
        'role',
        'permissions',
        'theme_preference',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'permissions' => 'array',
        ];
    }

    public function freights(): HasMany
    {
        return $this->hasMany(Freight::class);
    }

    public function isPlatformAdmin(): bool
    {
        return $this->role === self::ROLE_PLATFORM_ADMIN;
    }

    public function isCompanyAdmin(): bool
    {
        return $this->role === self::ROLE_COMPANY_ADMIN;
    }

    public function isCompanyEmployee(): bool
    {
        return $this->role === self::ROLE_COMPANY_EMPLOYEE;
    }

    public function isAdmin(): bool
    {
        return $this->isCompanyAdmin() || $this->isCompanyEmployee();
    }

    public function isClient(): bool
    {
        return $this->role === self::ROLE_CLIENT;
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->isPlatformAdmin() || $this->isCompanyAdmin()) {
            return true;
        }

        if (! $this->isCompanyEmployee()) {
            return false;
        }

        $permissions = $this->permissions ?? [];

        return (bool) ($permissions[$permission] ?? false);
    }

    public static function defaultEmployeePermissions(): array
    {
        return [
            'view_audit_logs' => false,
            'manage_admins' => false,
            'manage_employees' => false,
        ];
    }

    public function trucks(): HasMany
    {
        return $this->hasMany(Truck::class);
    }

    public function drivers(): HasMany
    {
        return $this->hasMany(Driver::class);
    }

    public function createdTimeslots(): HasMany
    {
        return $this->hasMany(Timeslot::class, 'created_by');
    }

    public function whatsappCommands(): HasMany
    {
        return $this->hasMany(WhatsAppCommand::class);
    }

    public function visibleTimeslots(): BelongsToMany
    {
        return $this->belongsToMany(Timeslot::class, 'client_timeslot', 'user_id', 'timeslot_id');
    }

    public function routeWhatsAppPhone(): ?string
    {
        $strPhone = WhatsAppPhone::normalize($this->whatsapp_phone);

        return WhatsAppPhone::isValid($strPhone) ? $strPhone : null;
    }
}
