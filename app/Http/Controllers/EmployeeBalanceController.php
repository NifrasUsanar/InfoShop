<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\EmployeeBalanceLog;
use App\Models\Employee;
use App\Models\SalaryRecord;
use App\Models\Store;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EmployeeBalanceController extends Controller
{
    public function balanceLog(Request $request)
    {
        $filters = $request->only(['employee', 'store_id', 'start_date', 'end_date']);

        // Set default date range to current month's start and end date if not provided
        if (!isset($filters['start_date']) || !isset($filters['end_date'])) {
            $filters['start_date'] = now()->startOfMonth()->toDateString();
            $filters['end_date'] = now()->endOfMonth()->toDateString();
        }

        // Fetch EmployeeBalanceLog records
        $balanceLogs = EmployeeBalanceLog::select(
            'employee_balance_logs.amount',
            DB::raw("'Balance Update: ' || employee_balance_logs.description as description"),
            'employee_balance_logs.log_date'
        )
            ->orderBy('employee_balance_logs.log_date', 'desc');

        // Apply filters if provided
        if (isset($filters['employee'])) {
            $balanceLogs->where('employee_balance_logs.employee_id', $filters['employee']);
        }

        if (isset($filters['store_id'])) {
            $balanceLogs->where('employee_balance_logs.store_id', $filters['store_id']);
        }

        if (isset($filters['start_date']) && isset($filters['end_date'])) {
            $balanceLogs->whereBetween('employee_balance_logs.log_date', [$filters['start_date'], $filters['end_date']]);
        }

        $balanceLogs = $balanceLogs->get();

        // Fetch SalaryRecord records
        $salaryRecords = SalaryRecord::select(
            DB::raw("'Salary Settled' as description"),
            'salary_records.net_salary as settled',
            'salary_records.salary_date as log_date',
            'salary_records.adjusts_balance',
            'salary_records.remarks'
        )
            ->orderBy('salary_records.salary_date', 'desc');

        // Apply filters if provided
        if (isset($filters['employee'])) {
            $salaryRecords->where('salary_records.employee_id', $filters['employee']);
        }

        if (isset($filters['store_id'])) {
            $salaryRecords->where('salary_records.store_id', $filters['store_id']);
        }

        if (isset($filters['start_date']) && isset($filters['end_date'])) {
            $salaryRecords->whereBetween('salary_records.salary_date', [$filters['start_date'], $filters['end_date']]);
        }

        $salaryRecords = $salaryRecords->get();
        
        $report = [];

        // Add Balance Logs to the report
        foreach ($balanceLogs as $log) {
            $report[] = [
                'log_date' => $log->log_date,
                'description' => $log->description,
                'salary' => $log->amount >= 0 ? $log->amount : 0, // Positive amounts are receivables
                'settled' => $log->amount < 0 ? abs($log->amount) : 0, // Negative amounts are settlements
            ];
        }
    
        // Add Salary Records to the report
        foreach ($salaryRecords as $record) {
            // If the record adjusts the balance, create another record
            if (!$record->adjusts_balance) {
                $report[] = [
                    'log_date' => $record->log_date,
                    'description' => "Balance Update: Salary", // Better description
                    'salary' => $record->settled, // Add settled amount to salary
                    'settled' => 0, // Settled is set to 0 for this record
                ];
            }

            $report[] = [
                'log_date' => $record->log_date,
                'description' => $record->remarks ? $record->description . ' | ' . $record->remarks : $record->description,
                'salary' => 0, // Salary records don't contribute to receivables
                'settled' => $record->settled, // Settled amount for the salary
            ];
        }
    
        // Sort the report by date
        usort($report, function ($a, $b) {
            return strtotime($a['log_date']) - strtotime($b['log_date']);
        });

        $employees = Employee::select('id', 'name')->get();
        $stores = Store::select('id', 'name')->get();
        $employee = Employee::find($filters['employee']);
        return Inertia::render('Employee/EmployeeReport', [
            'employees' => $employees,
            'employee' => $employee,
            'stores' => $stores,
            'pageLabel' => 'Salary Log',
            'report' => $report, // Include the results as a report
        ]);
    }

    public function store(Request $request)
    {
        // Validate the incoming request data
        $validatedData = $request->validate([
            'employee_id' => 'required|exists:employees,id', // Ensure the employee exists
            'amount'      => 'required|numeric',            // Balance amount
            'description'      => 'required|string',
        ]);

        DB::beginTransaction();
        try {
            // Create a new employee balance record
            EmployeeBalanceLog::create([
                'employee_id' => $validatedData['employee_id'],
                'amount'      => $validatedData['amount'],
                'description'      => $validatedData['description'],
                'store_id' => $request->store_id,
                'log_date' => $request->log_date,
            ]);

            $employee = Employee::find($validatedData['employee_id']);
            if ($employee) {
                // Increment the balance by the provided amount
                $employee->increment('balance', $validatedData['amount']);
            }

            DB::commit();

            return response()->json(['message' => 'Balance updated successfully'], 200);
        } catch (\Exception $e) {
            // Rollback transaction in case of error
            DB::rollBack();

            // Log the error details
            Log::error('Balance transaction failed', [
                'error_message' => $e->getMessage(),
                'file'          => $e->getFile(),
                'line'          => $e->getLine(),
                'trace'         => $e->getTraceAsString(),
            ]);

            // Return error response
            return response()->json(['error' => 'Failed to update balance'], 500);
        }
    }
}
