<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class FreightAttachment extends Model
{
    public const TYPE_INVOICE = 'invoice';

    public const TYPE_ATTACHMENT = 'attachment';

    protected $fillable = [
        'freight_id',
        'company_id',
        'type',
        'path',
        'original_name',
        'size_bytes',
        'mime_type',
    ];

    protected $appends = ['admin_url', 'client_url'];

    protected $casts = [
        'size_bytes' => 'integer',
    ];

    public function getAdminUrlAttribute(): string
    {
        if ($this->type === self::TYPE_INVOICE) {
            return route('freights.download-invoice', $this->freight_id);
        }

        return route('freights.download-attachment', [$this->freight_id, $this->id]);
    }

    public function getClientUrlAttribute(): string
    {
        if ($this->type === self::TYPE_INVOICE) {
            return route('client.download-invoice', $this->freight_id);
        }

        return '#';
    }

    /**
     * @deprecated Use admin_url or client_url instead.
     */
    public function getUrlAttribute(): string
    {
        // Tenta disco local primeiro; cai no disco padrão para arquivos legados
        if (Storage::disk('local')->exists($this->path)) {
            return $this->admin_url;
        }

        return Storage::url($this->path);
    }

    public function freight(): BelongsTo
    {
        return $this->belongsTo(Freight::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
