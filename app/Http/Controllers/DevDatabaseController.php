<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DevDatabaseController extends Controller
{
    public function query(Request $request)
    {
        if (app()->isProduction()) {
            return response()->json(['error' => 'Not available in production'], 403);
        }

        try {
            $table = $request->query('table');
            $action = $request->query('action', 'read');
            $limit = (int) $request->query('limit', 100);
            $skip = (int) $request->query('skip', 0);
            $where = $request->query('where', []);

            if (!$table) {
                return response()->json(['error' => 'Table name required'], 400);
            }

            $query = DB::table($table);

            if (is_array($where) && count($where) > 0) {
                foreach ($where as $column => $value) {
                    $query->where($column, $value);
                }
            }

            if ($action === 'read') {
                $total = $query->count();
                $records = $query->skip($skip)->take($limit)->get();
                return response()->json([
                    'table' => $table,
                    'total' => $total,
                    'limit' => $limit,
                    'skip' => $skip,
                    'data' => $records
                ]);
            }

            if ($action === 'columns') {
                $columns = DB::select('DESCRIBE ' . $table);
                return response()->json(['columns' => $columns]);
            }

            return response()->json(['error' => 'Invalid action'], 400);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
