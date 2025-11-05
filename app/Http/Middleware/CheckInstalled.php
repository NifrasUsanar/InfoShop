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
        // Check if installation file exists
        if (!File::exists(storage_path('installed'))) {
            return redirect()->route('installer.welcome');
        }

        // Check if users table exists (safety check for incomplete installation)
        try {
            if (!Schema::hasTable('users')) {
                return redirect()->route('installer.welcome');
            }
        } catch (\Exception $e) {
            // Database connection error, redirect to installer
            return redirect()->route('installer.welcome');
        }

        return $next($request);
    }
}
