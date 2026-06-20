<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\SyncController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\ReportController;

// Authentication
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Public health check
Route::get('/sync/health', [SyncController::class, 'healthCheck']);

// Sync endpoints (authenticated)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/sync/verify', [SyncController::class, 'verify']);
    Route::get('/sync', [SyncController::class, 'fetch']);
    Route::post('/sync/sales', [SyncController::class, 'pushSales']);
});

// Sales endpoint (authenticated) - handles both API and Inertia
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/sales', [SaleController::class, 'index']);
    Route::get('/sales/{id}/receipt', [SaleController::class, 'receipt']);
    Route::post('/getorderdetails/{type}', [ReportController::class, 'viewOrderDetails']);
});

// Get authenticated user
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
