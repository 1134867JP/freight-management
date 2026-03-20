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

    protected $casts = [
        'size_bytes' => 'integer',
    ];

    public function getUrlAttribute(): string
    {
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
