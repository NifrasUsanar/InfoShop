<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Transaction;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\Contact;
use App\Models\User;
use Carbon\Carbon;

class DemoSaleSeeder extends Seeder
{
    public function run(): void
    {
        $customers = Contact::where('type', 'customer')->get();
        $guest     = Contact::find(1);

        // Load products with their default batch
        $products = Product::with(['batches' => function ($q) {
            $q->where('is_active', true)->orderBy('id');
        }])->where('is_active', true)->get();

        if ($products->isEmpty()) {
            $this->command->warn('No products found — run DemoProductSeeder first.');
            return;
        }

        // [contactIndex(null=guest), items=>[[skuIndex,qty]], payMethod, daysAgo, timeStr]
        // contactIndex: 0-7 = customer, null = guest
        $salesPlan = [
            // Week 4 ago
            [null, [0, 2, 3],    'Cash',   28, '09:15:00'],
            [0,    [10, 11],     'Cash',   28, '10:30:00'],
            [1,    [5, 6, 8],    'Credit', 27, '11:00:00'],
            [null, [22, 23],     'Cash',   27, '14:20:00'],
            [2,    [0],          'Cash',   26, '09:45:00'],
            [3,    [15, 17],     'Credit', 26, '15:30:00'],
            [null, [5, 8, 13],   'Cash',   25, '10:10:00'],
            [4,    [1, 2],       'Credit', 25, '11:45:00'],
            [5,    [20, 21],     'Cash',   24, '13:00:00'],
            [null, [22, 23, 24], 'Cash',   24, '16:00:00'],

            // Week 3 ago
            [6,    [10, 12, 13], 'Cash',   21, '09:00:00'],
            [null, [5, 6],       'Cash',   21, '10:30:00'],
            [7,    [0, 3],       'Credit', 20, '11:15:00'],
            [0,    [18, 15],     'Cash',   20, '14:00:00'],
            [1,    [9, 8],       'Cash',   19, '09:30:00'],
            [null, [20, 19],     'Cash',   19, '12:00:00'],
            [2,    [5, 6, 7],    'Credit', 18, '10:45:00'],
            [3,    [22, 23],     'Cash',   18, '15:15:00'],
            [null, [10, 11, 12], 'Cash',   17, '09:00:00'],
            [4,    [0, 2],       'Credit', 17, '11:30:00'],

            // Week 2 ago
            [5,    [15, 16, 17], 'Cash',   14, '10:00:00'],
            [null, [5, 8, 9],    'Cash',   14, '11:45:00'],
            [6,    [20, 21, 22], 'Cash',   13, '09:15:00'],
            [7,    [0, 1],       'Credit', 13, '14:30:00'],
            [null, [10, 13],     'Cash',   12, '10:30:00'],
            [0,    [5, 6, 7],    'Cash',   12, '15:00:00'],
            [1,    [22, 23, 24], 'Credit', 11, '09:45:00'],
            [2,    [18, 16],     'Cash',   11, '11:00:00'],
            [null, [5, 8],       'Cash',   10, '13:15:00'],
            [3,    [0, 3],       'Credit', 10, '16:30:00'],

            // Last week
            [4,    [20, 19],     'Cash',    7, '09:00:00'],
            [null, [10, 12, 13], 'Cash',    7, '10:30:00'],
            [5,    [15, 17, 18], 'Cash',    6, '11:45:00'],
            [6,    [5, 6, 7, 8], 'Credit',  6, '14:00:00'],
            [null, [22, 23],     'Cash',    5, '09:30:00'],
            [7,    [0, 1, 2],    'Cash',    5, '12:00:00'],
            [0,    [20, 21],     'Credit',  4, '10:15:00'],
            [1,    [10, 11, 12], 'Cash',    4, '15:45:00'],
            [null, [5, 9],       'Cash',    3, '09:00:00'],
            [2,    [22, 24],     'Cash',    3, '11:30:00'],

            // This week
            [3,    [0, 3],       'Credit',  2, '09:45:00'],
            [null, [5, 6, 8],    'Cash',    2, '10:30:00'],
            [4,    [15, 16],     'Cash',    2, '14:00:00'],
            [5,    [20, 22],     'Cash',    1, '09:15:00'],
            [6,    [1, 3, 5],    'Cash',    1, '11:00:00'],
            [null, [10, 13, 23], 'Cash',    1, '13:30:00'],
            [7,    [0, 2],       'Credit',  1, '15:00:00'],
            [0,    [5, 7, 8],    'Cash',    0, '09:30:00'],
            [1,    [22, 23, 24], 'Cash',    0, '11:15:00'],
            [null, [5, 6],       'Cash',    0, '14:45:00'],
        ];

        $productsArr  = $products->values();
        $totalSeeded  = 0;

        // Resolve user IDs for created_by — fallback to 1 if no staff users exist
        $staffUserIds = User::whereIn('user_role', ['super-admin', 'admin'])->pluck('id')->toArray();
        if (empty($staffUserIds)) {
            $staffUserIds = [1];
        }

        foreach ($salesPlan as $plan) {
            [$contactIdx, $productIndexes, $payMethod, $daysAgo, $timeStr] = $plan;

            $contact   = $contactIdx !== null ? ($customers[$contactIdx] ?? $guest) : $guest;
            $saleDate  = Carbon::now()->subDays($daysAgo)->toDateString();

            $cartItems = [];
            foreach ($productIndexes as $pIdx) {
                $product = $productsArr[$pIdx] ?? null;
                if (!$product) continue;
                $batch = $product->productBatches->first();
                if (!$batch) continue;
                $qty       = rand(1, 3);
                $cartItems[] = compact('product', 'batch', 'qty');
            }

            if (empty($cartItems)) continue;

            $subtotal    = 0;
            $profitTotal = 0;
            foreach ($cartItems as $item) {
                $lineTotal    = $item['qty'] * $item['batch']->price;
                $lineProfit   = $item['qty'] * ($item['batch']->price - $item['batch']->cost);
                $subtotal    += $lineTotal;
                $profitTotal += $lineProfit;
            }

            $discount = 0;
            $total    = $subtotal - $discount;

            $sale = Sale::create([
                'sale_type'      => 'sale',
                'store_id'       => 1,
                'contact_id'     => $contact->id,
                'sale_date'      => $saleDate,
                'sale_time'      => $timeStr,
                'total_amount'   => $total,
                'discount'       => $discount,
                'amount_received'=> $total,
                'profit_amount'  => $profitTotal,
                'status'         => 'completed',
                'payment_status' => $payMethod === 'Credit' ? 'pending' : 'completed',
                'note'           => null,
                'created_by'     => $staffUserIds[array_rand($staffUserIds)],
            ]);

            foreach ($cartItems as $item) {
                SaleItem::create([
                    'sale_id'    => $sale->id,
                    'product_id' => $item['product']->id,
                    'batch_id'   => $item['batch']->id,
                    'quantity'   => $item['qty'],
                    'unit_price' => $item['batch']->price,
                    'unit_cost'  => $item['batch']->cost,
                    'discount'   => 0,
                    'flat_discount' => 0,
                    'sale_date'  => $saleDate,
                    'item_type'  => 'product',
                ]);
            }

            // Transaction
            Transaction::create([
                'sales_id'         => $sale->id,
                'store_id'         => 1,
                'contact_id'       => $contact->id,
                'transaction_date' => $saleDate,
                'amount'           => $total,
                'payment_method'   => $payMethod,
                'transaction_type' => 'sale',
                'created_by'       => 1,
            ]);

            // Update contact balance for Credit sales
            if ($payMethod === 'Credit' && $contact->id !== 1) {
                $contact->decrement('balance', $total);
            }

            $totalSeeded++;
        }

        $this->command->info("Sales seeded: {$totalSeeded}");
    }
}
