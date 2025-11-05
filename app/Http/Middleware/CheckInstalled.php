<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class CheckInstalled
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // First check if users table exists (primary indicator of a running system)
        // This allows existing systems (installed before the installer was added) to work
        try {
            if (Schema::hasTable('users')) {
                // System is set up - create installed file if missing (for new installs tracking)
                if (!File::exists(storage_path('installed'))) {
                    File::put(storage_path('installed'), date('Y-m-d H:i:s'));
                }
                return $next($request);
            }
        } catch (\Exception $e) {
            // Database connection error - not yet configured
        }

        // If users table doesn't exist, check for installation file
        // For systems that completed installation after this check was added
        if (File::exists(storage_path('installed'))) {
            return $next($request);
        }

        // No users table and no installation file = not installed, send to installer
        return redirect()->route('installer.welcome');
    }
}
