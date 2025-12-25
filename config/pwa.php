<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Application Name
    |--------------------------------------------------------------------------
    |
    | This value is the name of your application shown in the PWA manifest
    | and on the user's home screen when installed.
    |
    */
    'name' => env('APP_NAME', 'InfoShop POS'),
    'short_name' => 'InfoShop',

    /*
    |--------------------------------------------------------------------------
    | Application Description
    |--------------------------------------------------------------------------
    |
    | Brief description of your application shown in app stores and install
    | prompts.
    |
    */
    'description' => 'Point of Sale system with offline support',

    /*
    |--------------------------------------------------------------------------
    | Theme & Background Colors
    |--------------------------------------------------------------------------
    |
    | These colors define the app's appearance when installed. Theme color
    | affects the browser UI, background color is shown during splash screen.
    |
    */
    'theme_color' => '#1e88e5',
    'background_color' => '#ffffff',

    /*
    |--------------------------------------------------------------------------
    | Display Mode
    |--------------------------------------------------------------------------
    |
    | How the app should be displayed when launched.
    | Options: standalone, fullscreen, minimal-ui, browser
    |
    */
    'display' => 'standalone',

    /*
    |--------------------------------------------------------------------------
    | Start URL
    |--------------------------------------------------------------------------
    |
    | The page that loads when the PWA is launched.
    |
    */
    'start_url' => '/pos-offline',

    /*
    |--------------------------------------------------------------------------
    | Scope
    |--------------------------------------------------------------------------
    |
    | Defines the navigation scope of the PWA.
    |
    */
    'scope' => '/',

    /*
    |--------------------------------------------------------------------------
    | Orientation
    |--------------------------------------------------------------------------
    |
    | Preferred orientation: portrait, landscape, any
    |
    */
    'orientation' => 'portrait',

    /*
    |--------------------------------------------------------------------------
    | Icons
    |--------------------------------------------------------------------------
    |
    | App icons for different sizes and purposes.
    | Path is relative to public/ directory.
    |
    */
    'icons' => [
        [
            'src' => '/Infoshop-icon.png',
            'sizes' => '512x512',
            'type' => 'image/png',
            'purpose' => 'any maskable',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Service Worker Cache Version
    |--------------------------------------------------------------------------
    |
    | Increment this when you want to force cache refresh.
    | Format: infoshop-v{VERSION}
    |
    */
    'cache_version' => env('PWA_CACHE_VERSION', 1),

    /*
    |--------------------------------------------------------------------------
    | Offline Route
    |--------------------------------------------------------------------------
    |
    | The route to show when offline and page is not cached.
    |
    */
    'offline_route' => '/offline',
];
