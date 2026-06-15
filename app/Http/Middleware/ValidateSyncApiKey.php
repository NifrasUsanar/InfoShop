<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * ValidateSyncApiKey Middleware
 * 
 * Validates the X-API-Key header against the configured SYNC_API_KEY
 * Used to secure sync endpoints for mobile applications
 */
class ValidateSyncApiKey
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $configuredKey = \App\Models\Setting::where('meta_key', 'sync_api_key')->value('meta_value')
            ?: config('app.sync_api_key');
        
        // If no API key is configured, deny access for security
        if (empty($configuredKey)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Sync API key not configured on server',
            ], 500);
        }

        $providedKey = $request->header('X-API-Key');

        // Check if API key is provided
        if (empty($providedKey)) {
            return response()->json([
                'status' => 'error',
                'message' => 'API key required. Please provide X-API-Key header.',
            ], 401);
        }

        // Validate API key using constant-time comparison to prevent timing attacks
        if (!hash_equals($configuredKey, $providedKey)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid API key',
            ], 403);
        }

        return $next($request);
    }
}
