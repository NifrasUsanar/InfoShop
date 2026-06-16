<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Expense;
use Carbon\Carbon;

class DemoExpenseSeeder extends Seeder
{
    public function run(): void
    {
        $expenses = [
            // Monthly recurring
            ['Rent',              'Monthly shop rent',                    85000, 30, 'rent'],
            ['Electricity Bill',  'Monthly electricity charges',           8500, 28, 'utilities'],
            ['Water Bill',        'Monthly water charges',                 1200, 28, 'utilities'],
            ['Internet Bill',     'Monthly broadband subscription',        3500, 27, 'utilities'],

            // Staff & Admin
            ['Office Supplies',   'Pens, paper, printer ink',             2800, 25, 'office'],
            ['Cleaning Supplies', 'Mops, detergents, trash bags',          950, 24, 'maintenance'],
            ['Advertising',       'Facebook & Google ads - November',     12000, 22, 'marketing'],
            ['Printing',          'Receipt paper rolls x50',               1800, 20, 'office'],
            ['Packaging',         'Carry bags and wrapping materials',     4500, 18, 'supplies'],

            // Maintenance
            ['AC Service',        'Air conditioner maintenance',           3500, 15, 'maintenance'],
            ['Security System',   'CCTV maintenance monthly fee',          2000, 14, 'maintenance'],
            ['POS Supplies',      'Thermal paper rolls and ink ribbon',    1200, 12, 'supplies'],

            // Misc
            ['Transport',         'Delivery charges for stock collection', 3200, 10, 'transport'],
            ['Advertising',       'Flyer printing and distribution',       6500,  8, 'marketing'],
            ['Staff Refreshments','Tea, coffee, and snacks for staff',     2400,  7, 'staff'],
            ['Repairs',           'Shop signboard repair',                 4800,  5, 'maintenance'],
            ['Bank Charges',      'Monthly bank service fee',               500,  3, 'banking'],
            ['Stationery',        'Notebooks and stationery for office',    650,  2, 'office'],
            ['Transport',         'Fuel for delivery bike',                2800,  1, 'transport'],
            ['Miscellaneous',     'Petty cash expenses',                   1500,  0, 'misc'],
        ];

        foreach ($expenses as [$desc, $note, $amount, $daysAgo, $source]) {
            Expense::create([
                'store_id'     => 1,
                'description'  => $desc,
                'amount'       => $amount,
                'expense_date' => Carbon::now()->subDays($daysAgo)->toDateString(),
                'source'       => $source,
                'created_by'   => 1,
            ]);
        }

        $this->command->info('Expenses seeded: ' . count($expenses));
    }
}
