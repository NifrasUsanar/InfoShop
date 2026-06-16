<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Cheque;
use Carbon\Carbon;

class DemoChequeSeeder extends Seeder
{
    public function run(): void
    {
        $cheques = [
            // Received cheques (from customers)
            [
                'cheque_number' => 'CHQ-001234',
                'cheque_date'   => Carbon::now()->addDays(15)->toDateString(),
                'name'          => 'Ahmed Hassan',
                'amount'        => 12000,
                'issued_date'   => Carbon::now()->subDays(5)->toDateString(),
                'bank'          => 'Commercial Bank',
                'status'        => 'pending',
                'direction'     => 'received',
                'remark'        => 'Payment for credit sales - November',
            ],
            [
                'cheque_number' => 'CHQ-005678',
                'cheque_date'   => Carbon::now()->addDays(7)->toDateString(),
                'name'          => 'Mary Fernando',
                'amount'        => 8500,
                'issued_date'   => Carbon::now()->subDays(3)->toDateString(),
                'bank'          => 'Peoples Bank',
                'status'        => 'pending',
                'direction'     => 'received',
                'remark'        => 'Partial payment for outstanding balance',
            ],
            [
                'cheque_number' => 'CHQ-009012',
                'cheque_date'   => Carbon::now()->subDays(2)->toDateString(),
                'name'          => 'Tom Brown',
                'amount'        => 6500,
                'issued_date'   => Carbon::now()->subDays(12)->toDateString(),
                'bank'          => 'HNB Bank',
                'status'        => 'cleared',
                'direction'     => 'received',
                'remark'        => 'Full payment - cleared',
            ],
            [
                'cheque_number' => 'CHQ-003456',
                'cheque_date'   => Carbon::now()->subDays(10)->toDateString(),
                'name'          => 'Ravi Kumar',
                'amount'        => 25000,
                'issued_date'   => Carbon::now()->subDays(20)->toDateString(),
                'bank'          => 'BOC Bank',
                'status'        => 'cleared',
                'direction'     => 'received',
                'remark'        => 'Bulk order payment',
            ],
            [
                'cheque_number' => 'CHQ-007890',
                'cheque_date'   => Carbon::now()->addDays(30)->toDateString(),
                'name'          => 'Nilufar Rashid',
                'amount'        => 18000,
                'issued_date'   => Carbon::now()->subDays(1)->toDateString(),
                'bank'          => 'Sampath Bank',
                'status'        => 'pending',
                'direction'     => 'received',
                'remark'        => 'Post-dated cheque for credit purchase',
            ],

            // Issued cheques (to vendors)
            [
                'cheque_number' => 'CHQ-IS-0012',
                'cheque_date'   => Carbon::now()->addDays(10)->toDateString(),
                'name'          => 'Tech Supplies Co',
                'amount'        => 350000,
                'issued_date'   => Carbon::now()->subDays(2)->toDateString(),
                'bank'          => 'Commercial Bank',
                'status'        => 'pending',
                'direction'     => 'issued',
                'remark'        => 'Payment for electronics stock',
            ],
            [
                'cheque_number' => 'CHQ-IS-0013',
                'cheque_date'   => Carbon::now()->subDays(5)->toDateString(),
                'name'          => 'Fresh Foods Ltd',
                'amount'        => 85000,
                'issued_date'   => Carbon::now()->subDays(15)->toDateString(),
                'bank'          => 'Commercial Bank',
                'status'        => 'cleared',
                'direction'     => 'issued',
                'remark'        => 'Monthly grocery stock payment',
            ],
            [
                'cheque_number' => 'CHQ-IS-0014',
                'cheque_date'   => Carbon::now()->subDays(1)->toDateString(),
                'name'          => 'Garment World',
                'amount'        => 120000,
                'issued_date'   => Carbon::now()->subDays(8)->toDateString(),
                'bank'          => 'Peoples Bank',
                'status'        => 'pending',
                'direction'     => 'issued',
                'remark'        => 'Payment for clothing stock - October batch',
            ],
            [
                'cheque_number' => 'CHQ-IS-0015',
                'cheque_date'   => Carbon::now()->subDays(20)->toDateString(),
                'name'          => 'Office Essentials',
                'amount'        => 32000,
                'issued_date'   => Carbon::now()->subDays(30)->toDateString(),
                'bank'          => 'Commercial Bank',
                'status'        => 'cleared',
                'direction'     => 'issued',
                'remark'        => 'Stationery and office supply payment',
            ],
            [
                'cheque_number' => 'CHQ-IS-0016',
                'cheque_date'   => Carbon::now()->addDays(5)->toDateString(),
                'name'          => 'Fresh Foods Ltd',
                'amount'        => 48000,
                'issued_date'   => Carbon::now()->toDateString(),
                'bank'          => 'Commercial Bank',
                'status'        => 'pending',
                'direction'     => 'issued',
                'remark'        => 'Advance payment for December stock',
            ],
        ];

        foreach ($cheques as $cheque) {
            Cheque::create(array_merge($cheque, [
                'store_id'   => 1,
                'created_by' => 1,
            ]));
        }

        $this->command->info('Cheques seeded: ' . count($cheques));
    }
}
