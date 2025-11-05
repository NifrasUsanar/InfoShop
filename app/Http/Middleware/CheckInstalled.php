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
        // Skip check for installer routes (already public)
        if ($request->routeIs('installer.*')) {
            return $next($request);
        }

        // Try to check if system is installed
        try {
            // Test database connection first
            DB::connection()->getPdo();
            // Database connection successful - check if users table exists
            if (Schema::hasTable('users')) {
                // System is set up - create installed file if missing (for new installs tracking)
                if (!File::exists(storage_path('installed'))) {
                    File::put(storage_path('installed'), date('Y-m-d H:i:s'));
                }
                return $next($request);
            }

            // Database exists but users table doesn't - needs installation
            // Check if installation file was created (for safety check)
            if (File::exists(storage_path('installed'))) {
                // File says installed but users table missing - database corrupted/reset
                // Log this unusual state but allow access (admins might be fixing it)
                logger()->warning('Installation file exists but users table missing. Database may be corrupted or reset.');
                return $next($request);
            }

            // Not installed - redirect to installer
            return redirect()->route('installer.welcome');
        } catch (\PDOException $e) {
            // Database connection failed
            logger()->error('Database connection failed during installation check', [
                'message' => $e->getMessage(),
            ]);
            return redirect()->route('installer.welcome');
        } catch (\Exception $e) {
            // Other errors (schema check, etc)
            logger()->error('Error checking installation status', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return redirect()->route('installer.welcome');
        }
    }
}
