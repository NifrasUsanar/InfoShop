<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class CheckInstalled
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->routeIs('installer.*')) {
            return $next($request);
        }

        try {
            DB::connection()->getPdo();

            $installed = DB::table('settings')->where('meta_key', 'installed_at')->exists();

            if ($installed) {
                return $next($request);
            }

            return redirect()->route('installer.welcome');
        } catch (\PDOException $e) {
            logger()->error('Database connection failed during installation check', [
                'message' => $e->getMessage(),
            ]);
            return redirect()->route('installer.welcome');
        } catch (\Exception $e) {
            logger()->error('Error checking installation status', [
                'message' => $e->getMessage(),
            ]);
            return redirect()->route('installer.welcome');
        }
    }
}
