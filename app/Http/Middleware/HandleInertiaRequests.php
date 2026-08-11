<?php

namespace App\Http\Middleware;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $company = null;

        if ($user?->company_id) {
            $user->loadMissing('company');

            $company = [
                'id'          => $user->company?->id,
                'name'        => $user->company?->name,
                'slug'        => $user->company?->slug,
                'logo_url'    => $user->company?->logo_url,
                'uses_queues' => $user->company?->uses_queues ?? true,
                'uses_docks'  => $user->company?->uses_docks ?? true,
                'pilot_mode'  => $user->company?->pilot_mode ?? false,
            ];
        }

        $permissions = null;
        if ($user) {
            $permissions = [
                User::PERMISSION_VIEW_AUDIT_LOGS => $user->hasPermission(User::PERMISSION_VIEW_AUDIT_LOGS),
                User::PERMISSION_MANAGE_ADMINS => $user->hasPermission(User::PERMISSION_MANAGE_ADMINS),
                User::PERMISSION_MANAGE_EMPLOYEES => $user->hasPermission(User::PERMISSION_MANAGE_EMPLOYEES),
                User::PERMISSION_MANAGE_WHATSAPP => $user->hasPermission(User::PERMISSION_MANAGE_WHATSAPP),
                User::PERMISSION_CREATE_TIMESLOTS_VIA_WHATSAPP => $user->hasPermission(User::PERMISSION_CREATE_TIMESLOTS_VIA_WHATSAPP),
                User::PERMISSION_USE_YMS_ASSISTANT => $user->hasPermission(User::PERMISSION_USE_YMS_ASSISTANT),
            ];
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'company' => $company,
                'permissions' => $permissions,
            ],
            'flash' => [
                'success'      => $request->session()->get('success'),
                'error'        => $request->session()->get('error'),
                'info'         => $request->session()->get('info'),
                'error_action' => $request->session()->get('error_action'),
            ],
        ];
    }
}
