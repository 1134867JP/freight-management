<?php

namespace App\Http\Middleware;

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
            $user->loadMissing('company.settings');

            $company = [
                'id' => $user->company?->id,
                'name' => $user->company?->name,
                'slug' => $user->company?->slug,
                'logo_url' => $user->company?->settings?->logo_url,
            ];
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'company' => $company,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'info' => $request->session()->get('info'),
            ],
        ];
    }
}
