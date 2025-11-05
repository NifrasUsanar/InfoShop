<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Store;
use App\Models\Contact;
use App\Models\Setting;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Exception;

class InstallerService
{
    /**
     * Check server requirements
     */
    public function checkRequirements(): array
    {
        $requirements = config('installer.requirements');
        $results = [];

        // Check PHP version
        $currentPhpVersion = PHP_VERSION;
        $requiredPhpVersion = $requirements['php_version'];
        $results['php'] = [
            'name' => 'PHP Version',
            'required' => '>= ' . $requiredPhpVersion,
            'current' => $currentPhpVersion,
            'status' => version_compare($currentPhpVersion, $requiredPhpVersion, '>='),
        ];

        // Check PHP extensions
        foreach ($requirements['extensions'] as $extension) {
            $results['extensions'][$extension] = [
                'name' => $extension,
                'status' => extension_loaded($extension),
            ];
        }

        // Check folder permissions
        $permissions = config('installer.permissions');
        foreach ($permissions as $folder => $permission) {
            $path = base_path($folder);
            $results['permissions'][$folder] = [
                'name' => $folder,
                'required' => $permission,
                'status' => is_writable($path),
            ];
        }

        return $results;
    }

    /**
     * Test database connection
     */
    public function testDatabaseConnection(array $credentials): array
    {
        try {
            $driver = $credentials['driver'] ?? 'mysql';

            if ($driver === 'sqlite') {
                $dbPath = $credentials['database'] ?? database_path('database.sqlite');
                
                // Create SQLite file if it doesn't exist
                if (!File::exists($dbPath)) {
                    $directory = dirname($dbPath);
                    if (!File::exists($directory)) {
                        File::makeDirectory($directory, 0755, true);
                    }
                    File::put($dbPath, '');
                }

                // Test SQLite connection
                $pdo = new \PDO("sqlite:" . $dbPath);
                $pdo->exec('SELECT 1');

                return [
                    'success' => true,
                    'message' => 'SQLite connection successful!',
                ];
            }

            // MySQL connection test
            $host = $credentials['host'] ?? 'localhost';
            $port = $credentials['port'] ?? '3306';
            $database = $credentials['database'];
            $username = $credentials['username'];
            $password = $credentials['password'];

            $dsn = "mysql:host={$host};port={$port};dbname={$database}";
            $pdo = new \PDO($dsn, $username, $password);
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

            // Check if InnoDB storage engine is available
            $stmt = $pdo->query("SHOW ENGINES");
            $engines = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            $innodbAvailable = false;

            foreach ($engines as $engine) {
                if (strtolower($engine['Engine']) === 'innodb' &&
                    in_array(strtolower($engine['Support']), ['yes', 'default'])) {
                    $innodbAvailable = true;
                    break;
                }
            }

            if (!$innodbAvailable) {
                return [
                    'success' => false,
                    'message' => 'InnoDB storage engine is not available. InnoDB is required for this application.',
                ];
            }

            return [
                'success' => true,
                'message' => 'Database connection successful! InnoDB is available.',
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Write production-ready environment file (all at once)
     * This combines database config, app settings, and production flags
     * into a single .env write to avoid triggering artisan serve restarts
     */
    public function writeEnvironmentFile(array $data): bool
    {
        try {
            $envPath = base_path('.env');
            $envExamplePath = base_path('.env.example');

            // Use .env.example as template if .env doesn't exist
            if (!File::exists($envPath) && File::exists($envExamplePath)) {
                File::copy($envExamplePath, $envPath);
            }

            $envContent = File::exists($envPath) ? File::get($envPath) : '';

            // ===== DATABASE CONFIGURATION =====
            $driver = $data['db_driver'] ?? 'mysql';

            if ($driver === 'sqlite') {
                $dbPath = $data['db_database'] ?? database_path('database.sqlite');
                $envContent = $this->setEnvValue($envContent, 'DB_CONNECTION', 'sqlite');
                $envContent = $this->setEnvValue($envContent, 'DB_DATABASE', $dbPath);
                // Remove MySQL-specific variables for SQLite
                $envContent = $this->setEnvValue($envContent, 'DB_HOST', '');
                $envContent = $this->setEnvValue($envContent, 'DB_PORT', '');
                $envContent = $this->setEnvValue($envContent, 'DB_USERNAME', '');
                $envContent = $this->setEnvValue($envContent, 'DB_PASSWORD', '');
            } else {
                $envContent = $this->setEnvValue($envContent, 'DB_CONNECTION', $driver);
                $envContent = $this->setEnvValue($envContent, 'DB_HOST', $data['db_host']);
                $envContent = $this->setEnvValue($envContent, 'DB_PORT', $data['db_port'] ?? '3306');
                $envContent = $this->setEnvValue($envContent, 'DB_DATABASE', $data['db_database']);
                $envContent = $this->setEnvValue($envContent, 'DB_USERNAME', $data['db_username']);
                $envContent = $this->setEnvValue($envContent, 'DB_PASSWORD', $data['db_password'] ?? '');
                $envContent = $this->setEnvValue($envContent, 'DB_ENGINE', 'InnoDB');
            }

            // ===== APPLICATION CONFIGURATION =====
            $envContent = $this->setEnvValue($envContent, 'APP_NAME', $data['app_name'] ?? 'InfoShop');
            $envContent = $this->setEnvValue($envContent, 'APP_URL', $data['app_url'] ?? 'http://localhost');
            $envContent = $this->setEnvValue($envContent, 'APP_TIMEZONE', $data['app_timezone'] ?? 'UTC');

            // ===== PRODUCTION ENVIRONMENT SETTINGS =====
            // Set to production immediately (no separate call later)
            $envContent = $this->setEnvValue($envContent, 'APP_ENV', 'production');
            $envContent = $this->setEnvValue($envContent, 'APP_DEBUG', 'false');

            // ===== SESSION & CACHE CONFIGURATION =====
            // Use database-backed sessions and cache for production
            $envContent = $this->setEnvValue($envContent, 'SESSION_DRIVER', 'database');
            $envContent = $this->setEnvValue($envContent, 'CACHE_STORE', 'database');

            // Write ALL configuration at once
            File::put($envPath, $envContent);

            // Generate application key if not exists
            if (strpos($envContent, 'APP_KEY=') === false || strpos($envContent, 'APP_KEY=base64:') === false) {
                Artisan::call('key:generate', ['--force' => true]);
            }

            return true;
        } catch (Exception $e) {
            throw new Exception('Failed to write environment file: ' . $e->getMessage());
        }
    }

    /**
     * Finalize installation with cache clears and storage link
     */
    private function finalizeInstallation(): void
    {
        try {
            // Clear cache with --no-interaction to prevent hanging
            Artisan::call('cache:clear', ['--no-interaction' => true]);
            Artisan::call('config:clear', ['--no-interaction' => true]);
            Artisan::call('route:clear', ['--no-interaction' => true]);
            Artisan::call('view:clear', ['--no-interaction' => true]);

            // Create storage link (non-critical, wrapped in try-catch)
            try {
                Artisan::call('storage:link', ['--no-interaction' => true]);
            } catch (Exception $e) {
                logger()->warning('Failed to create storage link: ' . $e->getMessage());
            }
        } catch (Exception $e) {
            // Non-critical error, log it but don't fail installation
            logger()->warning('Failed to finalize installation: ' . $e->getMessage());
        }
    }

    /**
     * Set environment variable value
     */
    private function setEnvValue(string $envContent, string $key, ?string $value): string
    {
        // Handle null values
        if ($value === null) {
            $value = '';
        }

        $escaped = str_replace('"', '\"', $value);
        $pattern = "/^{$key}=.*/m";

        if (preg_match($pattern, $envContent)) {
            return preg_replace($pattern, "{$key}=\"{$escaped}\"", $envContent);
        }

        return $envContent . "\n{$key}=\"{$escaped}\"";
    }

    /**
     * Run installation process
     */
    public function runInstallation(array $data): array
    {
        try {
            // Increase PHP timeout for long-running operations
            set_time_limit(300);

            // Clear config cache first so new .env values are loaded
            Artisan::call('config:clear', ['--no-interaction' => true]);

            // Run migrations BEFORE transaction - migration can drop/create tables
            // Using --no-interaction to prevent hanging on user input
            Artisan::call('migrate:fresh', [
                '--force' => true,
                '--no-interaction' => true,
            ]);

            // Now start transaction for seeding operations
            DB::beginTransaction();

            // Create roles and permissions
            $this->seedRolesAndPermissions();

            // Create Guest contact (ID = 1)
            $this->createGuestContact();

            // Create store
            $store = $this->createStore($data['store']);

            // Create admin user
            $admin = $this->createAdminUser($data['admin'], $store->id);

            // Seed default settings
            $this->seedDefaultSettings($data['store']['name'], $data['currency']);

            // Mark installation as complete
            File::put(storage_path('installed'), date('Y-m-d H:i:s'));

            DB::commit();

            // Clear caches and create storage link
            $this->finalizeInstallation();

            // Create .htaccess file for URL rewriting
            $this->createHtaccessFile();

            return [
                'success' => true,
                'message' => 'Installation completed successfully!',
                'admin_email' => $admin->email,
            ];
        } catch (Exception $e) {
            DB::rollBack();
            throw new Exception('Installation failed: ' . $e->getMessage());
        }
    }

    /**
     * Seed roles and permissions
     */
    private function seedRolesAndPermissions(): void
    {
        $superAdminRole = Role::firstOrCreate(['name' => 'super-admin']);
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $userRole = Role::firstOrCreate(['name' => 'user']);

        $permissions = [
            'pos', 'products', 'inventory', 'sales', 'customers', 'vendors',
            'charges', 'collections', 'expenses', 'quotations', 'reloads',
            'cheques', 'sold-items', 'purchases', 'payments', 'stores',
            'employees', 'payroll', 'media', 'settings',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $superAdminRole->givePermissionTo(Permission::all());
        $adminRole->givePermissionTo($permissions);
        $userRole->givePermissionTo(['products', 'pos']);
    }

    /**
     * Create guest contact
     */
    private function createGuestContact(): void
    {
        Contact::create([
            'id' => 1,
            'name' => 'Guest',
            'email' => null,
            'phone' => null,
            'address' => null,
            'balance' => 0.00,
            'loyalty_points' => null,
            'type' => 'customer',
        ]);
    }

    /**
     * Create store
     */
    private function createStore(array $data): Store
    {
        return Store::create([
            'name' => $data['name'],
            'address' => $data['address'],
            'contact_number' => $data['contact_number'],
            'sale_prefix' => $data['sale_prefix'],
            'current_sale_number' => 0,
        ]);
    }

    /**
     * Create admin user
     */
    private function createAdminUser(array $data, int $storeId): User
    {
        $user = User::create([
            'name' => $data['name'],
            'user_name' => $data['username'],
            'user_role' => 'super-admin',
            'email' => $data['email'],
            'store_id' => $storeId,
            'password' => Hash::make($data['password']),
        ]);

        $user->assignRole('super-admin');

        return $user;
    }

    /**
     * Seed default settings
     */
    private function seedDefaultSettings(string $shopName, array $currency): void
    {
        $defaults = config('installer.default_settings');

        $currencySettings = [
            'currency_symbol' => $currency['currency_symbol'],
            'currency_code' => $currency['currency_code'],
            'symbol_position' => $currency['symbol_position'],
            'decimal_separator' => $currency['decimal_separator'],
            'thousands_separator' => $currency['thousands_separator'],
            'decimal_places' => $currency['decimal_places'],
            'negative_format' => $currency['negative_format'],
            'show_currency_code' => $currency['show_currency_code'],
        ];

        $settings = [
            ['meta_key' => 'shop_name', 'meta_value' => $shopName],
            ['meta_key' => 'shop_logo', 'meta_value' => $defaults['shop_logo']],
            ['meta_key' => 'sale_receipt_note', 'meta_value' => $defaults['sale_receipt_note']],
            ['meta_key' => 'sale_print_padding_right', 'meta_value' => $defaults['sale_print_padding_right']],
            ['meta_key' => 'sale_print_padding_left', 'meta_value' => $defaults['sale_print_padding_left']],
            ['meta_key' => 'sale_print_font', 'meta_value' => $defaults['sale_print_font']],
            ['meta_key' => 'show_barcode_store', 'meta_value' => $defaults['show_barcode_store']],
            ['meta_key' => 'show_barcode_product_price', 'meta_value' => $defaults['show_barcode_product_price']],
            ['meta_key' => 'show_barcode_product_name', 'meta_value' => $defaults['show_barcode_product_name']],
            ['meta_key' => 'product_code_increment', 'meta_value' => $defaults['product_code_increment']],
            ['meta_key' => 'modules', 'meta_value' => $defaults['modules']],
            ['meta_key' => 'misc_settings', 'meta_value' => json_encode($defaults['misc_settings'])],
            ['meta_key' => 'barcode_settings', 'meta_value' => json_encode($defaults['barcode_settings'])],
            ['meta_key' => 'currency_settings', 'meta_value' => json_encode($currencySettings)],
        ];

        // Get barcode template from view
        $barcodeTemplate = File::get(resource_path('views/templates/barcode-template-simple.html'));
        $settings[] = ['meta_key' => 'barcode_template', 'meta_value' => $barcodeTemplate];

        Setting::insert($settings);
    }

    /**
     * Create .htaccess file for URL rewriting
     */
    private function createHtaccessFile(): void
    {
        try {
            $htaccessPath = base_path('.htaccess');

            // Only create if it doesn't exist
            if (File::exists($htaccessPath)) {
                return;
            }

            $htaccessContent = <<<'EOT'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !/public
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
EOT;

            File::put($htaccessPath, $htaccessContent);
        } catch (Exception $e) {
            // Non-critical error, log but don't fail installation
            logger()->warning('Failed to create .htaccess file: ' . $e->getMessage());
        }
    }

    /**
     * Check if application is already installed
     */
    public function isInstalled(): bool
    {
        return File::exists(storage_path('installed'));
    }
}
