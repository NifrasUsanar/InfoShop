<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\SyncController;

// Mobile / API authentication endpoints for InfoPOS
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Unified Sync API endpoints for offline-first InfoPOS app
// GET /api/sync?table=products - Fetch data
// POST /api/sync/sales - Push sales from mobile POS
// GET /api/sync/health - Health check
// GET /api/sync/verify - Verify sync URL configuration
// Protected by X-API-Key header authentication
Route::middleware('sync.api')->group(function () {
    Route::get('/sync/health', [SyncController::class, 'healthCheck']);
    Route::get('/sync/verify', [SyncController::class, 'verify']);
    Route::get('/sync', [SyncController::class, 'fetch']);
    Route::post('/sync/sales', [SyncController::class, 'pushSales']); // Push sales from mobile
});


// Dedicated sync endpoints for POS Offline
// Protected by X-API-Key header authentication
Route::middleware('sync.api')->group(function () {
    Route::get('/products/sync', function (Request $request) {
        $request->merge(['table' => 'products']);
        return app(SyncController::class)->fetch($request);
    });

    Route::get('/charges/sync', function (Request $request) {
        $request->merge(['table' => 'charges']);
        return app(SyncController::class)->fetch($request);
    });

    Route::get('/collections/sync', function (Request $request) {
        $request->merge(['table' => 'collections']);
        return app(SyncController::class)->fetch($request);
    });

    Route::get('/contacts/sync', function (Request $request) {
        $request->merge(['table' => 'contacts']);
        return app(SyncController::class)->fetch($request);
    });
});

// Test route to get current authenticated user
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
