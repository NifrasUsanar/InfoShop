<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Opcodes\LogViewer\Facades\LogViewer;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Blade;
use App\Models\Setting;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Initialize analytics tracking
        Blade::directive('init', function () {
            return config('init');
        });

        LogViewer::auth(function ($request) {
            /** @var \App\Models\User */
            $user = Auth::user();
            return $user && $user->hasRole('super-admin');
        });

        // Load mail settings from database (if table exists)
        // Skip during console commands and if table doesn't exist yet
        try {
            if (!App::runningInConsole() && Schema::hasTable('settings')) {
                $mailSetting = Setting::where('meta_key', 'mail_settings')->first();

                if ($mailSetting) {
                    $mailSettings = json_decode($mailSetting->meta_value);
                    Config::set(['mail.driver' => 'smtp']);
                    Config::set(['mail.host' => $mailSettings->mail_host]);
                    Config::set(['mail.port' => $mailSettings->mail_port]);
                    Config::set(['mail.username' => $mailSettings->mail_username]);
                    Config::set(['mail.password' => $mailSettings->mail_password]);
                    Config::set(['mail.encryption' => $mailSettings->mail_encryption]);
                    Config::set(['mail.from.address' => $mailSettings->mail_from_address]);
                    Config::set(['mail.from.name' => $mailSettings->mail_from_name]);
                }
            }
        } catch (\Exception $e) {
            // Silently fail if settings table doesn't exist (e.g., during fresh installation)
            \Illuminate\Support\Facades\Log::debug('Settings table not available: ' . $e->getMessage());
        }
    }
}
