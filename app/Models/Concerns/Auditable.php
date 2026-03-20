<?php

namespace App\Models\Concerns;

use App\Models\AuditLog;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            AuditLog::record('created', $model, null, $model->filterAuditAttributes($model->getAttributes()));
        });

        static::updated(function ($model) {
            $changed = $model->filterAuditAttributes($model->getDirty());

            if (empty($changed)) {
                return;
            }

            $old = array_intersect_key($model->filterAuditAttributes($model->getOriginal()), $changed);

            AuditLog::record('updated', $model, $old, $changed);
        });

        static::deleted(function ($model) {
            AuditLog::record('deleted', $model, $model->filterAuditAttributes($model->getAttributes()), null);
        });
    }

    public function filterAuditAttributes(array $attributes): array
    {
        $hidden = $this->getHidden();

        return array_diff_key($attributes, array_flip($hidden));
    }
}
