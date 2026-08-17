<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppOutboxMessage extends Model
{
    protected $table = 'whatsapp_outbox_messages';

    public const STATUS_PENDING = 'pending';

    public const STATUS_SENDING = 'sending';

    public const STATUS_SENT = 'sent';

    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'company_id',
        'whatsapp_instance_id',
        'whatsapp_command_id',
        'idempotency_key',
        'phone',
        'message',
        'context',
        'status',
        'attempts',
        'available_at',
        'sent_at',
        'failed_at',
        'provider_message_id',
        'last_error',
    ];

    protected $casts = [
        'context' => 'array',
        'available_at' => 'datetime',
        'sent_at' => 'datetime',
        'failed_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function instance(): BelongsTo
    {
        return $this->belongsTo(WhatsAppInstance::class, 'whatsapp_instance_id');
    }

    public function command(): BelongsTo
    {
        return $this->belongsTo(WhatsAppCommand::class, 'whatsapp_command_id');
    }
}
