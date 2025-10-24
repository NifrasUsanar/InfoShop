<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use ZipArchive;
use Illuminate\Support\Str;
class BackupController extends Controller
{
    public function download($file)
    {
        $filePath = "backups/{$file}";

        if (!Storage::disk('local')->exists($filePath)) {
            abort(404, "Backup file not found.");
        }

        return response()->download(storage_path("app/{$filePath}"));
    }

    public function downloadBackupZip()
    {
        $dbName = env('DB_DATABASE');
        $tables = DB::select('SHOW TABLES');
        $tableKey = 'Tables_in_' . $dbName;

        $sql = '';

        foreach ($tables as $table) {
            $tableName = $table->$tableKey;

            // Drop table
            $sql .= "DROP TABLE IF EXISTS `$tableName`;\n";

            // Create table
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

        // Create a temporary ZIP file
        $zipFileName = 'db-backup-' . date('Y-m-d_H-i-s') . '.zip';
        $tmpZipPath = storage_path(Str::random(16) . '.zip');

        $timestamp = date('Y-m-d_H-i-s');
        $sqlFileName = "backup-{$timestamp}.sql";

        $zip = new ZipArchive();
        $zip->open($tmpZipPath, ZipArchive::CREATE);
        $zip->addFromString($sqlFileName, $sql);
        $zip->close();

        // Return as download and delete after sending
        return response()->download($tmpZipPath, $zipFileName)->deleteFileAfterSend(true);
    }
}
