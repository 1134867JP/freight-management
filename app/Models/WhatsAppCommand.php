<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppCommand extends Model
{
    protected $table = 'whatsapp_commands';

    public const STATUS_RECEIVED = 'received';

    public const STATUS_PENDING_CONFIRMATION = 'pending_confirmation';

    public const STATUS_EXECUTED = 'executed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'company_id',
        'whatsapp_instance_id',
        'user_id',
        'client_id',
        'timeslot_id',
        'external_message_id',
        'confirmation_message_id',
        'sender_phone',
        'message',
        'intent',
        'parsed_payload',
        'status',
        'response_message',
        'error_message',
        'expires_at',
        'confirmed_at',
        'executed_at',
    ];

    protected $casts = [
        'parsed_payload' => 'array',
        'expires_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'executed_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function instance(): BelongsTo
    {
        return $this->belongsTo(WhatsAppInstance::class, 'whatsapp_instance_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function timeslot(): BelongsTo
    {
        return $this->belongsTo(Timeslot::class);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query
            ->where('status', self::STATUS_PENDING_CONFIRMATION)
            ->where('expires_at', '>', now());
    }

    public function protocol(): string
    {
        return '#WA-'.str_pad((string) $this->getKey(), 6, '0', STR_PAD_LEFT);
    }
}
