<?php

namespace App\Http\Controllers;

use App\Services\InstallerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use DateTimeZone;

class InstallerController extends Controller
{
    protected $installer;

    public function __construct(InstallerService $installer)
    {
        $this->installer = $installer;
    }

    /**
     * Show welcome page
     */
    public function welcome()
    {
        if ($this->installer->isInstalled()) {
            return redirect('/login')->with('error', 'Application is already installed.');
        }

        return view('installer.welcome');
    }

    /**
     * Show requirements page
     */
    public function requirements()
    {
        try {
            $requirements = $this->installer->checkRequirements();
            return view('installer.requirements', compact('requirements'));
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to check requirements: ' . $e->getMessage());
        }
    }

    /**
     * Show database configuration page
     */
    public function database()
    {
        $drivers = config('installer.database_drivers');
        return view('installer.database', compact('drivers'));
    }

    /**
     * Test database connection (AJAX)
     */
    public function testDatabase(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'driver' => 'required|in:mysql,sqlite',
                'database' => 'required_if:driver,mysql,sqlite',
                'host' => 'required_if:driver,mysql',
                'username' => 'required_if:driver,mysql',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $result = $this->installer->testDatabaseConnection($request->all());
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database test failed: ' . $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }

    /**
     * Show application settings page
     */
    public function settings()
    {
        try {
            // Get all available timezones
            $timezones = DateTimeZone::listIdentifiers();

            return view('installer.settings', compact('timezones'));
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to load settings: ' . $e->getMessage());
        }
    }

    /**
     * Show store and currency configuration page
     */
    public function store()
    {
        try {
            $defaultCurrency = config('installer.default_currency');
            return view('installer.store', compact('defaultCurrency'));
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to load store settings: ' . $e->getMessage());
        }
    }

    /**
     * Show admin account creation page
     */
    public function admin()
    {
        return view('installer.admin');
    }

    /**
     * Show installation page
     */
    public function install()
    {
        return view('installer.install');
    }

    /**
     * Process installation
     */
    public function processInstallation(Request $request)
    {
        // Validate request
        $validator = Validator::make($request->all(), [
            // Database
            'db_driver' => 'required|in:mysql,sqlite',
            'db_database' => 'required',
            'db_host' => 'required_if:db_driver,mysql',
            'db_username' => 'required_if:db_driver,mysql',

            // Application
            'app_name' => 'required|string|max:255',
            'app_url' => 'required|url',
            'app_timezone' => 'required|string',

            // Store
            'store_name' => 'required|string|max:255',
            'store_address' => 'required|string',
            'store_contact' => 'required|string|max:20',
            'sale_prefix' => 'required|string|max:10',

            // Currency
            'currency_symbol' => 'required|string|max:10',
            'currency_code' => 'required|string|max:10',
            'symbol_position' => 'required|in:before,after',
            'decimal_separator' => 'required|in:.,\,',
            'thousands_separator' => 'required|in:",",.," "',
            'decimal_places' => 'required|in:0,2,3',
            'negative_format' => 'required|in:minus,parentheses',
            'show_currency_code' => 'required|in:yes,no',

            // Admin
            'admin_name' => 'required|string|max:255',
            'admin_username' => 'required|string|max:255|alpha_dash',
            'admin_email' => 'required|email|max:255',
            'admin_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            // Write environment file (ALL production-ready settings at once)
            $this->installer->writeEnvironmentFile([
                'db_driver' => $request->db_driver,
                'db_host' => $request->db_host,
                'db_port' => $request->db_port ?? '3306',
                'db_database' => $request->db_database,
                'db_username' => $request->db_username,
                'db_password' => $request->db_password,
                'app_name' => $request->app_name,
                'app_url' => $request->app_url,
                'app_timezone' => $request->app_timezone,
            ]);
        } catch (\Exception $e) {
            logger()->error('Installation: Failed to write environment file', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return back()
                ->with('error', 'Failed to write environment file: ' . $e->getMessage())
                ->withInput();
        }

        try {
            // Run installation (migrations + seeding + data setup)
            $result = $this->installer->runInstallation([
                'store' => [
                    'name' => $request->store_name,
                    'address' => $request->store_address,
                    'contact_number' => $request->store_contact,
                    'sale_prefix' => $request->sale_prefix,
                ],
                'currency' => [
                    'currency_symbol' => $request->currency_symbol,
                    'currency_code' => $request->currency_code,
                    'symbol_position' => $request->symbol_position,
                    'decimal_separator' => $request->decimal_separator,
                    'thousands_separator' => $request->thousands_separator,
                    'decimal_places' => $request->decimal_places,
                    'negative_format' => $request->negative_format,
                    'show_currency_code' => $request->show_currency_code,
                ],
                'admin' => [
                    'name' => $request->admin_name,
                    'username' => $request->admin_username,
                    'email' => $request->admin_email,
                    'password' => $request->admin_password,
                ],
            ]);

            logger()->info('Installation completed successfully', [
                'admin_email' => $result['admin_email'] ?? null,
            ]);

            return redirect()
                ->route('installer.complete')
                ->with('success', 'Installation completed successfully!');
        } catch (\Exception $e) {
            logger()->error('Installation: Failed during installation process', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return back()
                ->with('error', 'Installation failed: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Show completion page
     */
    public function complete()
    {
        try {
            if (!$this->installer->isInstalled()) {
                return redirect()->route('installer.welcome');
            }

            return view('installer.complete');
        } catch (\Exception $e) {
            return back()->with('error', 'Installation verification failed: ' . $e->getMessage());
        }
    }
}
