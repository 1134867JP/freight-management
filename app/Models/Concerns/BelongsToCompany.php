<?php

namespace App\Models\Concerns;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

trait BelongsToCompany
{
    public static function bootBelongsToCompany(): void
    {
        static::creating(function (Model $model): void {
            if (filled($model->getAttribute('company_id'))) {
                return;
            }

            $objUser = static::resolveTenantUser();

            if (! $objUser || ! method_exists($objUser, 'isPlatformAdmin') || $objUser->isPlatformAdmin()) {
                return;
            }

            $model->setAttribute('company_id', $objUser->company_id);
        });

        static::addGlobalScope('company', function (Builder $builder): void {
            $objUser = static::resolveTenantUser();

            if (! $objUser || ! method_exists($objUser, 'isPlatformAdmin') || $objUser->isPlatformAdmin()) {
                return;
            }

            if (! filled($objUser->company_id)) {
                return;
            }

            $builder->where(
                $builder->qualifyColumn('company_id'),
                $objUser->company_id,
            );
        });
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function scopeForCompany(Builder $query, Company|int $company): Builder
    {
        $idCompany = $company instanceof Company ? $company->getKey() : $company;

        return $query->where($query->qualifyColumn('company_id'), $idCompany);
    }

    protected static function resolveTenantUser(): ?User
    {
        if (! app()->bound('auth')) {
            return null;
        }

        $guard = Auth::guard();

        if (! method_exists($guard, 'hasUser') || ! $guard->hasUser()) {
            return null;
        }

        $objUser = $guard->user();

        return $objUser instanceof User ? $objUser : null;
    }
}
