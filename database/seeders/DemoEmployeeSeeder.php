<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\SalaryRecord;
use Carbon\Carbon;

class DemoEmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $employees = [
            [
                'name'             => 'Kamal Perera',
                'contact_number'   => '0711234567',
                'address'          => '15 Main Street, Colombo 10',
                'joined_at'        => Carbon::now()->subMonths(18)->toDateString(),
                'salary'           => 65000,
                'salary_frequency' => 'monthly',
                'role'             => 'Store Manager',
                'status'           => 'active',
                'gender'           => 'male',
                'balance'          => 0,
            ],
            [
                'name'             => 'Nimal Silva',
                'contact_number'   => '0722345678',
                'address'          => '34 Lake Road, Nugegoda',
                'joined_at'        => Carbon::now()->subMonths(12)->toDateString(),
                'salary'           => 42000,
                'salary_frequency' => 'monthly',
                'role'             => 'Cashier',
                'status'           => 'active',
                'gender'           => 'male',
                'balance'          => 0,
            ],
            [
                'name'             => 'Amali Fernando',
                'contact_number'   => '0733456789',
                'address'          => '8 Flower Road, Dehiwala',
                'joined_at'        => Carbon::now()->subMonths(8)->toDateString(),
                'salary'           => 42000,
                'salary_frequency' => 'monthly',
                'role'             => 'Cashier',
                'status'           => 'active',
                'gender'           => 'female',
                'balance'          => 0,
            ],
            [
                'name'             => 'Suresh Bandara',
                'contact_number'   => '0744567890',
                'address'          => '22 Temple Road, Moratuwa',
                'joined_at'        => Carbon::now()->subMonths(24)->toDateString(),
                'salary'           => 35000,
                'salary_frequency' => 'monthly',
                'role'             => 'Stock Handler',
                'status'           => 'active',
                'gender'           => 'male',
                'balance'          => 0,
            ],
        ];

        foreach ($employees as $emp) {
            $employee = Employee::create(array_merge($emp, ['store_id' => 1, 'created_by' => 1]));

            // Create 3 months of salary records
            for ($i = 3; $i >= 1; $i--) {
                $salaryDate = Carbon::now()->subMonths($i)->startOfMonth();
                SalaryRecord::create([
                    'employee_id'   => $employee->id,
                    'store_id'      => 1,
                    'salary_date'   => $salaryDate->toDateString(),
                    'basic_salary'  => $employee->salary,
                    'allowances'    => 0,
                    'deductions'    => 0,
                    'gross_salary'  => $employee->salary,
                    'net_salary'    => $employee->salary,
                    'salary_from'   => $salaryDate->format('Y-m'),
                    'adjusts_balance' => false,
                    'created_by'    => 1,
                ]);
            }
        }

        $this->command->info('Employees seeded: ' . count($employees));
    }
}
