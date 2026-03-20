<?php

namespace App\Models\Concerns;

use App\Models\AuditLog;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            AuditLog::record('created', $model, null, $model->getAttributes());
        });

        static::updated(function ($model) {
            $changed = $model->getDirty();

            if (empty($changed)) {
                return;
            }

            $old = array_intersect_key($model->getOriginal(), $changed);

            AuditLog::record('updated', $model, $old, $changed);
        });

        static::deleted(function ($model) {
            AuditLog::record('deleted', $model, $model->getAttributes(), null);
        });
    }
}
