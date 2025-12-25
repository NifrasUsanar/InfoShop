<?php

namespace App\Helpers;

class PwaHelper
{
    /**
     * Get PWA configuration
     */
    public static function config(string $key = null, $default = null)
    {
        if ($key) {
            return config("pwa.{$key}", $default);
        }
        return config('pwa');
    }

    /**
     * Get manifest data as array
     */
    public static function getManifestData(): array
    {
        return [
            'name' => self::config('name'),
            'short_name' => self::config('short_name'),
            'description' => self::config('description'),
            'start_url' => self::config('start_url'),
            'display' => self::config('display'),
            'background_color' => self::config('background_color'),
            'theme_color' => self::config('theme_color'),
            'scope' => self::config('scope'),
            'orientation' => self::config('orientation'),
            'icons' => self::config('icons'),
        ];
    }

    /**
     * Get PWA meta tags HTML
     */
    public static function getMetaTags(): string
    {
        $config = self::config();
        
        return sprintf(
            '<!-- PWA Meta Tags -->
<meta name="theme-color" content="%s">
<meta name="mobile-web-app-capable" content="yes">
<meta name="application-name" content="%s">
<link rel="manifest" href="/manifest.json">

<!-- iOS Meta Tags -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="%s">
<link rel="apple-touch-icon" href="%s">',
            $config['theme_color'],
            $config['short_name'],
            $config['short_name'],
            $config['icons'][0]['src'] ?? '/Infoshop-icon.png'
        );
    }

    /**
     * Get service worker registration script
     */
    public static function getServiceWorkerScript(): string
    {
        return <<<'JS'
<script>
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('✅ Service Worker registered:', registration.scope);
                })
                .catch((error) => {
                    console.error('❌ Service Worker registration failed:', error);
                });
        });
    }
</script>
JS;
    }
}
