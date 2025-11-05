<?php

use App\Http\Controllers\InstallerController;
use Illuminate\Support\Facades\Route;

Route::prefix('install')->name('installer.')->group(function () {
    Route::get('/', [InstallerController::class, 'welcome'])->name('welcome');
    Route::get('/requirements', [InstallerController::class, 'requirements'])->name('requirements');
    Route::get('/database', [InstallerController::class, 'database'])->name('database');
    Route::post('/database/test', [InstallerController::class, 'testDatabase'])->name('database.test');
    Route::get('/settings', [InstallerController::class, 'settings'])->name('settings');
    Route::get('/store', [InstallerController::class, 'store'])->name('store');
    Route::get('/admin', [InstallerController::class, 'admin'])->name('admin');
    Route::get('/install', [InstallerController::class, 'install'])->name('install');
    Route::post('/process', [InstallerController::class, 'processInstallation'])->name('process');
    Route::get('/complete', [InstallerController::class, 'complete'])->name('complete');
});
