<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Server Requirements
    |--------------------------------------------------------------------------
    |
    | This is the list of server requirements that will be checked during
    | the installation process.
    |
    */
    'requirements' => [
        'php_version' => '8.2',
        'extensions' => [
            'bcmath',
            'ctype',
            'fileinfo',
            'json',
            'mbstring',
            'openssl',
            'pdo',
            'tokenizer',
            'xml',
            'curl',
            'zip',
            'gd',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Folder Permissions
    |--------------------------------------------------------------------------
    |
    | This is the list of folders that need to be writable during installation.
    |
    */
    'permissions' => [
        'storage/framework/' => '775',
        'storage/logs/' => '775',
        'bootstrap/cache/' => '775',
    ],

    /*
    |--------------------------------------------------------------------------
    | Database Drivers
    |--------------------------------------------------------------------------
    |
    | Supported database drivers for installation.
    |
    */
    'database_drivers' => [
        'mysql' => 'MySQL',
        'sqlite' => 'SQLite',
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Currency Settings
    |--------------------------------------------------------------------------
    */
    'default_currency' => [
        'currency_symbol' => 'Rs.',
        'currency_code' => 'LKR',
        'symbol_position' => 'before',
        'decimal_separator' => '.',
        'thousands_separator' => ',',
        'decimal_places' => '2',
        'negative_format' => 'minus',
        'show_currency_code' => 'no',
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Settings
    |--------------------------------------------------------------------------
    */
    'default_settings' => [
        'shop_logo' => 'infoshop-logo.png',
        'sale_receipt_note' => 'Thank you for your business!',
        'sale_print_padding_right' => '35',
        'sale_print_padding_left' => '2',
        'sale_print_font' => 'Arial, sans-serif',
        'show_barcode_store' => 'on',
        'show_barcode_product_price' => 'on',
        'show_barcode_product_name' => 'on',
        'product_code_increment' => '1000',
        'modules' => 'Cheques',
        'misc_settings' => [
            'optimize_image_size' => '0.5',
            'optimize_image_width' => '400',
            'cheque_alert' => '2',
            'product_alert' => '1',
        ],
        'barcode_settings' => [
            'format' => 'CODE128',
            'width' => 2,
            'height' => 35,
            'fontSize' => 14,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Installation Steps
    |--------------------------------------------------------------------------
    */
    'steps' => [
        'welcome' => 'Welcome',
        'requirements' => 'Server Requirements',
        'database' => 'Database Setup',
        'settings' => 'Application Settings',
        'store' => 'Store & Currency',
        'admin' => 'Admin Account',
        'install' => 'Installation',
        'complete' => 'Complete',
    ],
];
