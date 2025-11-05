<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Setting;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

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
    public function version(Request $request): string|null
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
        $permissions = collect();
        if ($request->user()) {
            $user = $request->user();
            $role = Role::where('name',$user->user_role)->first();
            $permissions = $role->permissions;
        }

        try {
            $shopNameMeta = Setting::where('meta_key', 'shop_name')->first();
            $currencySettingsMeta = Setting::where('meta_key', 'currency_settings')->first();

            // Parse currency settings JSON or use defaults
            $currencySettings = [];
            if ($currencySettingsMeta) {
                try {
                    $currencySettings = json_decode($currencySettingsMeta->meta_value, true) ?? [];
                } catch (\Exception $e) {
                    $currencySettings = [];
                }
            }

            $modules = Setting::getModules();
            $shopName = $shopNameMeta->meta_value ?? 'InfoShop';
        } catch (\Exception $e) {
            // If settings table doesn't exist, use defaults
            $currencySettings = [];
            $modules = [];
            $shopName = 'InfoShop';
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'settings'=>[
                'shop_name'=> $shopName ?? 'InfoShop',
                'currency_settings'=>$currencySettings,
            ],
            'modules'=> $modules ?? [],
            'userPermissions'=>$permissions->pluck('name'),
        ];
    }
}
