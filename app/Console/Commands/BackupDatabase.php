<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BackupDatabase extends Command
{
    protected $signature = 'backup:database';
    protected $description = 'Backup database to a SQL file';

    public function handle()
    {
        $dbName = env('DB_DATABASE');
        $user = env('DB_USERNAME');
        $password = env('DB_PASSWORD');
        $host = env('DB_HOST');

        $tables = DB::select('SHOW TABLES');

        $sql = '';
        $tableKey = 'Tables_in_' . $dbName;

        foreach ($tables as $table) {
            $tableName = $table->$tableKey;

            // Drop table statement
            $sql .= "DROP TABLE IF EXISTS `$tableName`;\n";

            // Create table statement
            $createTable = DB::select("SHOW CREATE TABLE `$tableName`");
            $sql .= $createTable[0]->{'Create Table'} . ";\n\n";

            // Insert data
            $rows = DB::table($tableName)->get();
            foreach ($rows as $row) {
                $row = (array) $row;
                $columns = implode('`,`', array_keys($row));
                $values = implode("','", array_map(fn($v) => addslashes($v), $row));
                $sql .= "INSERT INTO `$tableName` (`$columns`) VALUES ('$values');\n";
            }
            $sql .= "\n\n";
        }

        $fileName = 'backups/db-backup-' . date('Y-m-d_H-i-s') . '.sql';
        Storage::disk('local')->put($fileName, $sql);

        $this->info("Database backup saved to storage/app/$fileName");
    }
}
