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

// Test route to get current authenticated user
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
