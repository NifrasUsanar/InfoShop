<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use ZipArchive;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;

class UpgradeController extends Controller
{
    public function showUploadForm()
    {
        return Inertia::render('Update/Update',[
            'pageLabel'=>'Update',
        ]);
    }

    public function showUploadFormV2()
    {
        return Inertia::render('Update/UpdateV2',[
            'pageLabel'=>'Update V2',
        ]);
    }

    /**
     * Show Maintenance page with tabs
     */
    public function showMaintenance()
    {
        return Inertia::render('Maintenance/Maintenance');
    }

    /**
     * Get database tables information (shared hosting compatible)
     */
    public function getDatabaseTables()
    {
        try {
            // Get all table names using SHOW TABLES (works on shared hosting)
            $tableNames = DB::select('SHOW TABLES');
            $database = DB::connection()->getDatabaseName();
            $tableKey = 'Tables_in_' . $database;

            $tables = [];
            foreach ($tableNames as $table) {
                $tableName = $table->{$tableKey};

                try {
                    // Get table info using SHOW TABLE STATUS (more reliable for shared hosting)
                    $status = DB::select('SHOW TABLE STATUS WHERE Name = ?', [$tableName]);

                    if (!empty($status)) {
                        $info = $status[0];

                        // Get column information using SHOW COLUMNS
                        // Use backtick escaping without DB::raw() to avoid Expression conversion error
                        $columnQuery = "SHOW COLUMNS FROM `" . str_replace('`', '``', $tableName) . "`";
                        $columns = DB::select($columnQuery);

                        // Format column details
                        $columnDetails = array_map(function($col) {
                            return [
                                'name' => $col->Field,
                                'type' => $col->Type,
                                'null' => $col->Null === 'YES' ? true : false,
                                'key' => $col->Key ?? '',
                                'default' => $col->Default,
                                'extra' => $col->Extra ?? ''
                            ];
                        }, $columns);

                        $tables[] = [
                            'name' => $tableName,
                            'rows' => isset($info->Rows) ? (int)$info->Rows : 0,
                            'columns' => count($columns),
                            'columnDetails' => $columnDetails,
                            'collation' => isset($info->Collation) ? $info->Collation : 'N/A',
                            'engine' => isset($info->Engine) ? $info->Engine : 'N/A'
                        ];
                    }
                } catch (\Exception $tableError) {
                    // Skip tables that can't be accessed
                    Log::warning("Could not read table info for: {$tableName} - " . $tableError->getMessage());
                    continue;
                }
            }

            // Sort by table name
            usort($tables, function($a, $b) {
                return strcmp($a['name'], $b['name']);
            });

            return response()->json(['tables' => $tables]);
        } catch (\Exception $e) {
            Log::error('Failed to get database tables: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load database tables. Ensure you have proper database permissions.'], 500);
        }
    }

    /**
     * Get migrations status with comparison (file system vs database)
     */
    public function getMigrationStatus()
    {
        try {
            // Get file system migrations
            $migrationsPath = database_path('migrations');
            $fileSystemMigrations = [];

            if (File::exists($migrationsPath)) {
                $files = File::files($migrationsPath);
                foreach ($files as $file) {
                    $name = pathinfo($file->getFilename(), PATHINFO_FILENAME);
                    $fileSystemMigrations[$name] = [
                        'name' => $name,
                        'file' => $file->getFilename(),
                        'status' => 'pending'
                    ];
                }
            }

            // Check if migrations table exists
            $hasTable = DB::connection()->getSchemaBuilder()->hasTable('migrations');
            $executedMigrations = [];

            if ($hasTable) {
                $executed = DB::table('migrations')
                    ->orderBy('batch', 'desc')
                    ->orderBy('migration', 'desc')
                    ->get();

                foreach ($executed as $migration) {
                    $executedMigrations[$migration->migration] = [
                        'name' => $migration->migration,
                        'batch' => $migration->batch,
                        'status' => 'executed'
                    ];
                }
            }

            // Compare and merge
            $allMigrations = [];

            // Add executed migrations
            foreach ($executedMigrations as $name => $migrationData) {
                $allMigrations[$name] = $migrationData;
                if (isset($fileSystemMigrations[$name])) {
                    $allMigrations[$name]['inFileSystem'] = true;
                } else {
                    $allMigrations[$name]['inFileSystem'] = false; // Executed but file missing
                }
            }

            // Add pending migrations (in filesystem but not executed)
            foreach ($fileSystemMigrations as $name => $migrationData) {
                if (!isset($allMigrations[$name])) {
                    $allMigrations[$name] = [
                        'name' => $name,
                        'status' => 'pending',
                        'inFileSystem' => true
                    ];
                }
            }

            // Sort by name descending
            krsort($allMigrations);

            return response()->json([
                'migrations' => array_values($allMigrations),
                'summary' => [
                    'total' => count($allMigrations),
                    'executed' => count($executedMigrations),
                    'pending' => count($fileSystemMigrations) - count($executedMigrations),
                    'missing' => count(array_filter($allMigrations, fn($m) => !$m['inFileSystem']))
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get migration status: ' . $e->getMessage());
            return response()->json(['migrations' => [], 'summary' => []], 200);
        }
    }

    /**
     * Run pending migrations
     */
    public function runMigrations()
    {
        try {
            Artisan::call('migrate', ['--force' => true]);
            $output = Artisan::output();

            return response()->json([
                'message' => 'Migrations executed successfully',
                'output' => $output
            ]);
        } catch (\Exception $e) {
            Log::error('Migration execution failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Migration execution failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Run database seeders
     */
    public function runSeeders()
    {
        try {
            Artisan::call('db:seed');
            $output = Artisan::output();

            return response()->json([
                'message' => 'Seeders executed successfully',
                'output' => $output
            ]);
        } catch (\Exception $e) {
            Log::error('Seeder execution failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Seeder execution failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Backup database (shared hosting compatible)
     */
    public function backupDatabase()
    {
        try {
            $database = env('DB_DATABASE');
            $user = env('DB_USERNAME');
            $password = env('DB_PASSWORD');
            $host = env('DB_HOST');
            $port = env('DB_PORT', '3306');

            // Create backups directory if not exists
            $backupDir = storage_path('app/backups');
            if (!File::exists($backupDir)) {
                File::makeDirectory($backupDir, 0755, true);
            }

            $backupPath = $backupDir . '/db_' . date('Y-m-d_His') . '.sql';

            // Build mysqldump command with proper escaping for shared hosting
            $command = sprintf(
                'mysqldump --user=%s --password=%s --host=%s --port=%s %s > %s 2>&1',
                escapeshellarg($user),
                escapeshellarg($password),
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($database),
                escapeshellarg($backupPath)
            );

            $output = [];
            $returnCode = 0;
            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                $errorMsg = implode("\n", $output);
                Log::error('Database backup command failed: ' . $errorMsg);
                throw new \Exception('Database backup failed: ' . $errorMsg);
            }

            // Verify backup file was created and is not empty
            if (!File::exists($backupPath) || File::size($backupPath) === 0) {
                throw new \Exception('Backup file was not created or is empty');
            }

            // Download and delete after send
            return response()->download($backupPath)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            Log::error('Database backup failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Database backup failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function handleUpload(Request $request)
    {
        // Validate the uploaded file
        $request->validate([
            'zip_file' => 'required|file|mimes:zip',
        ]);

        // Handle the uploaded ZIP file
        $zipFile = $request->file('zip_file');
        $temporaryPath = storage_path('app/tmp_zip');
        $extractPath = $temporaryPath . '/extracted';

        // Create the temporary directories for extraction
        if (!File::exists($temporaryPath)) {
            File::makeDirectory($temporaryPath, 0755, true);
        }

        // Move the uploaded ZIP file to the temporary location
        $zipFilePath = $temporaryPath . '/uploaded.zip';
        $zipFile->move($temporaryPath, 'uploaded.zip');

        // Initialize ZIP extraction
        $zip = new ZipArchive;
        if ($zip->open($zipFilePath) === true) {
            // Extract the contents to a temporary directory
            $zip->extractTo($extractPath);
            $zip->close();

            // Define the root folders that can be replaced (without removing the folders themselves)
            $rootFolders = ['app', 'routes', 'resources', 'config','public','vendor','bootstrap','lang','database'];
            foreach ($rootFolders as $folder) {
                $source = $extractPath . '/' . $folder;
                $destination = base_path($folder);

                // If the source folder exists, extract the contents directly into the destination folder
                if (File::exists($source)) {
                    // Extract and overwrite the files automatically when extracting
                    File::copyDirectory($source, $destination);
                }
            }

            // Handle the build folder within the public directory (replace only if build exists in the ZIP)
            $existingBuildPath = public_path('build');
            $newBuildPath = $extractPath . '/build';
            
            // Check if the 'build' folder exists in the ZIP file
            if (File::exists($newBuildPath)) {
                // Delete the existing build folder before replacing it
                if (File::exists($existingBuildPath)) {
                    File::deleteDirectory($existingBuildPath);
                }

                // Now copy the new build folder contents
                File::copyDirectory($newBuildPath, $existingBuildPath);
            }

            // ** Handling the SQL file within the ZIP**
        $sqlFilePath = $extractPath . '/database.sql'; // Path to the SQL file in the extracted folder
        
        if (File::exists($sqlFilePath)) {
            try {
                // Read the SQL file contents
                $sql = File::get($sqlFilePath);
                
                // Execute SQL commands
                DB::unprepared($sql);  // Executes raw SQL directly
                
                // Optionally, log success or handle errors
                Log::info('SQL file executed successfully.');
            } catch (\Exception $e) {
                // Handle any exceptions
                Log::error('Failed to execute the SQL file: ' . $e->getMessage());
                File::deleteDirectory($temporaryPath);
                return response()->json(['error' => 'Failed to execute the SQL file. Check the logs for more information.'], 500);
            }
        }

            // Clean up temporary files
            File::deleteDirectory($temporaryPath);

            // Artisan::call('cache:clear');
            // Artisan::call('config:clear');
            // Artisan::call('route:clear');
            // Artisan::call('view:clear');
            // Artisan::call('event:clear');
            // Artisan::call('optimize:clear');

            return response()->json(['success' => 'Application upgrade applied successfully.'], 200);
        }

        return response()->json(['error' => 'Failed to extract the ZIP file.'], 500);
    }

    public function checkVersion()
    {
        return response()->json(['version' => config('version.version')]);
    }

    public function applicationUpdate(Request $request)
    {
        $updateToken = env('UPDATE_TOKEN');
        if ($updateToken !== request('update_token')) {
            return response()->json(['error' => 'Invalid update token'], 401);
        }

        return $this->handleUpload($request);
    }

    // ==================== V2 UPDATE METHODS ====================

    /**
     * Handle V2 upload with migration-based updates
     */
    public function handleUploadV2(Request $request)
    {
        // Validate the uploaded file
        $request->validate([
            'zip_file' => 'required|file|mimes:zip|max:51200', // 50MB max
        ]);

        $zipFile = $request->file('zip_file');
        $temporaryPath = storage_path('app/tmp_upgrade_v2');
        $extractPath = $temporaryPath . '/extracted';
        $backupPath = storage_path('app/backups/' . date('Y-m-d_His'));

        try {
            // Pre-flight checks
            $preflightCheck = $this->performPreflightChecks();
            if (!$preflightCheck['success']) {
                return response()->json(['error' => $preflightCheck['message']], 500);
            }

            // Enable maintenance mode
            $this->enableMaintenanceMode();

            // Create temporary and backup directories
            if (!File::exists($temporaryPath)) {
                File::makeDirectory($temporaryPath, 0755, true);
            }
            if (!File::exists($backupPath)) {
                File::makeDirectory($backupPath, 0755, true);
            }

            // Move uploaded ZIP to temporary location
            $zipFilePath = $temporaryPath . '/uploaded.zip';
            $zipFile->move($temporaryPath, 'uploaded.zip');

            // Extract ZIP
            $zip = new ZipArchive;
            if ($zip->open($zipFilePath) !== true) {
                throw new \Exception('Failed to open ZIP file.');
            }

            $zip->extractTo($extractPath);
            $zip->close();

            // Validate folder structure
            $folderValidation = $this->validateFolderStructure($extractPath);
            if (!$folderValidation['success']) {
                throw new \Exception($folderValidation['message']);
            }

            // Backup current installation
            $this->backupCurrentInstallation($backupPath);

            // Copy required folders to production
            $this->copyFoldersToProduction($extractPath);

            // Handle build folder separately (remove existing and replace with new)
            $this->handleBuildFolder($extractPath);

            // Run migrations (database folder already copied by copyFoldersToProduction)
            try {
                Artisan::call('migrate', ['--force' => true]);
                Log::info('Migrations executed successfully: ' . Artisan::output());
            } catch (\Exception $e) {
                Log::error('Migration failed: ' . $e->getMessage());
                throw new \Exception('Migration execution failed: ' . $e->getMessage());
            }

            // Clear caches
            $this->clearApplicationCaches();

            // Clean up temporary files
            File::deleteDirectory($temporaryPath);

            // Disable maintenance mode
            $this->disableMaintenanceMode();

            Log::info('V2 upgrade completed successfully');
            return response()->json([
                'success' => 'Application upgraded successfully using V2 process.',
                'migrations_output' => Artisan::output()
            ], 200);

        } catch (\Exception $e) {
            Log::error('V2 Upgrade failed: ' . $e->getMessage());

            // Attempt rollback
            if (File::exists($backupPath)) {
                $this->rollbackFromBackup($backupPath);
            }

            // Clean up
            if (File::exists($temporaryPath)) {
                File::deleteDirectory($temporaryPath);
            }

            $this->disableMaintenanceMode();

            return response()->json([
                'error' => 'Upgrade failed: ' . $e->getMessage(),
                'details' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Perform pre-flight checks before upgrade
     */
    private function performPreflightChecks()
    {
        // Check disk space (require at least 100MB free)
        $freeSpace = disk_free_space(base_path());
        if ($freeSpace < 100 * 1024 * 1024) {
            return [
                'success' => false,
                'message' => 'Insufficient disk space. At least 100MB required.'
            ];
        }

        // Check write permissions on critical folders
        $criticalFolders = ['app', 'bootstrap', 'config', 'database', 'public', 'resources', 'routes', 'storage'];
        foreach ($criticalFolders as $folder) {
            $path = base_path($folder);
            if (!is_writable($path)) {
                return [
                    'success' => false,
                    'message' => "Write permission denied on folder: {$folder}"
                ];
            }
        }

        // Check database connection
        try {
            DB::connection()->getPdo();
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Database connection failed: ' . $e->getMessage()
            ];
        }

        return ['success' => true];
    }

    /**
     * Validate folder structure in extracted update package
     */
    private function validateFolderStructure($extractPath)
    {
        // Required folders that MUST exist
        $requiredFolders = ['app', 'bootstrap', 'routes', 'resources', 'config', 'database'];

        // Optional folders that CAN be missing
        $optionalFolders = ['vendor', 'public'];

        $missingFolders = [];

        // Check required folders
        foreach ($requiredFolders as $folder) {
            if (!File::exists($extractPath . '/' . $folder)) {
                $missingFolders[] = $folder;
            }
        }

        // If any required folder is missing, fail the update
        if (!empty($missingFolders)) {
            return [
                'success' => false,
                'message' => 'Update package is incomplete. Missing required folders: ' . implode(', ', $missingFolders)
            ];
        }

        return ['success' => true];
    }

    /**
     * Copy folders from extracted update to production
     */
    private function copyFoldersToProduction($extractPath)
    {
        // Required folders - these MUST be copied
        $requiredFolders = ['app', 'bootstrap', 'routes', 'resources', 'config', 'database'];

        // Optional folders - copy only if they exist
        $optionalFolders = ['vendor', 'public'];

        // Copy all required folders
        foreach ($requiredFolders as $folder) {
            $source = $extractPath . '/' . $folder;
            $destination = base_path($folder);

            if (File::exists($source)) {
                File::copyDirectory($source, $destination);
                Log::info("Copied required folder: {$folder}");
            }
        }

        // Copy optional folders if they exist in the update package
        foreach ($optionalFolders as $folder) {
            $source = $extractPath . '/' . $folder;
            $destination = base_path($folder);

            if (File::exists($source)) {
                // For public folder, handle carefully (don't delete, just merge)
                if ($folder === 'public') {
                    // Copy contents of public folder
                    $publicFiles = File::files($source);
                    foreach ($publicFiles as $file) {
                        File::copy($file->getPathname(), $destination . '/' . $file->getFilename());
                    }
                    Log::info("Copied public folder contents");
                } else {
                    // For other optional folders (like vendor), copy entire directory
                    File::copyDirectory($source, $destination);
                    Log::info("Copied optional folder: {$folder}");
                }
            }
        }
    }

    /**
     * Handle build folder - remove existing and replace with new
     */
    private function handleBuildFolder($extractPath)
    {
        $existingBuildPath = public_path('build');
        $newBuildPath = $extractPath . '/public/build';

        // If new build folder exists in update package
        if (File::exists($newBuildPath)) {
            // Remove old build folder if it exists
            if (File::exists($existingBuildPath)) {
                File::deleteDirectory($existingBuildPath);
                Log::info('Removed old build folder');
            }

            // Copy new build folder
            File::copyDirectory($newBuildPath, $existingBuildPath);
            Log::info('Copied new build folder');
        } else {
            Log::warning('No build folder found in update package');
        }
    }

    /**
     * Backup current installation
     */
    private function backupCurrentInstallation($backupPath)
    {
        // Backup all required and optional folders that might be updated
        $foldersToBackup = [
            'app',
            'bootstrap',
            'routes',
            'resources',
            'config',
            'database',
            'public'
        ];

        foreach ($foldersToBackup as $folder) {
            $source = base_path($folder);
            $destination = $backupPath . '/' . $folder;

            if (File::exists($source)) {
                File::copyDirectory($source, $destination);
                Log::info("Backed up: {$folder}");
            }
        }

        // Also backup build folder if it exists
        $buildSource = public_path('build');
        if (File::exists($buildSource)) {
            File::copyDirectory($buildSource, $backupPath . '/build');
            Log::info("Backed up: public/build");
        }
    }

    /**
     * Rollback from backup
     */
    private function rollbackFromBackup($backupPath)
    {
        try {
            // Restore all folders that were backed up
            $foldersToRestore = [
                'app',
                'bootstrap',
                'routes',
                'resources',
                'config',
                'database',
                'public'
            ];

            foreach ($foldersToRestore as $folder) {
                $source = $backupPath . '/' . $folder;
                $destination = base_path($folder);

                if (File::exists($source)) {
                    // Remove current corrupted version
                    if (File::exists($destination)) {
                        File::deleteDirectory($destination);
                    }

                    // Restore from backup
                    File::copyDirectory($source, $destination);
                    Log::info("Restored from backup: {$folder}");
                }
            }

            // Restore build folder if backed up
            $buildBackup = $backupPath . '/build';
            $buildDest = public_path('build');
            if (File::exists($buildBackup)) {
                if (File::exists($buildDest)) {
                    File::deleteDirectory($buildDest);
                }
                File::copyDirectory($buildBackup, $buildDest);
                Log::info("Restored from backup: public/build");
            }

            Log::info('Rollback completed successfully');
        } catch (\Exception $e) {
            Log::error('Rollback failed: ' . $e->getMessage());
        }
    }

    /**
     * Clear application caches
     */
    private function clearApplicationCaches()
    {
        try {
            Artisan::call('cache:clear');
            Artisan::call('config:clear');
            Artisan::call('route:clear');
            Artisan::call('view:clear');
            Artisan::call('event:clear');
            Artisan::call('optimize:clear');
            Log::info('Application caches cleared');
        } catch (\Exception $e) {
            Log::warning('Failed to clear some caches: ' . $e->getMessage());
        }
    }

    /**
     * Enable maintenance mode
     */
    private function enableMaintenanceMode()
    {
        try {
            Artisan::call('down', [
                '--render' => 'errors::503',
                '--retry' => 60
            ]);
            Log::info('Maintenance mode enabled');
        } catch (\Exception $e) {
            Log::warning('Failed to enable maintenance mode: ' . $e->getMessage());
        }
    }

    /**
     * Disable maintenance mode
     */
    private function disableMaintenanceMode()
    {
        try {
            Artisan::call('up');
            Log::info('Maintenance mode disabled');
        } catch (\Exception $e) {
            Log::warning('Failed to disable maintenance mode: ' . $e->getMessage());
        }
    }

    /**
     * V2 Application Update (with token authentication)
     */
    public function applicationUpdateV2(Request $request)
    {
        $updateToken = env('UPDATE_TOKEN');
        if ($updateToken !== request('update_token')) {
            return response()->json(['error' => 'Invalid update token'], 401);
        }

        return $this->handleUploadV2($request);
    }
}
