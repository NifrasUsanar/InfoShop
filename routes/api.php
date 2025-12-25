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
// POST /api/sync?table=sales - Push data
// GET /api/sync/health - Health check
Route::get('/sync/health', [SyncController::class, 'healthCheck']);
Route::get('/sync', [SyncController::class, 'fetch']);
Route::post('/sync', [SyncController::class, 'push']);

// Firebase configuration endpoint for POS-Offline
Route::get('/config/firebase', function () {
    $config = config('services.firebase');

    // Only return config if at least project_id is set
    if (empty($config['project_id'])) {
        return response()->json([
            'status' => 'error',
            'message' => 'Firebase not configured. Please set FIREBASE_* variables in .env',
            'config' => null,
        ], 503);
    }

    return response()->json([
        'status' => 'success',
        'config' => [
            'apiKey' => $config['api_key'],
            'authDomain' => $config['auth_domain'],
            'databaseURL' => $config['database_url'],
            'projectId' => $config['project_id'],
            'storageBucket' => $config['storage_bucket'],
            'messagingSenderId' => $config['messaging_sender_id'],
            'appId' => $config['app_id'],
            'measurementId' => $config['measurement_id'],
        ],
    ]);
});

// Dedicated sync endpoints for POS Offline
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

// Test route to get current authenticated user
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
