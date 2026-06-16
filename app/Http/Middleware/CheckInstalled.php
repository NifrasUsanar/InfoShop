<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class CheckInstalled
{
    /**
     * This middleware should ONLY be applied to installer routes.
     * It prevents users from accessing the installer after the app is already installed.
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Check if we have a DB connection
            DB::connection()->getPdo();

            // Check if installed flag exists
            $installed = DB::table('settings')->where('meta_key', 'installed_at')->exists();

            if ($installed) {
                // App is already installed, prevent access to installer
                return redirect('/');
            }

            // Not installed yet, allow access to installer
            return $next($request);

        } catch (\PDOException $e) {
            // No DB connection yet (normal before installation)
            // Allow access to installer routes
            return $next($request);
        } catch (\Exception $e) {
            // Any other error, allow access to installer routes to fix it
            return $next($request);
        }
    }
}
