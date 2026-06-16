<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchaseTransaction;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\Contact;
use Carbon\Carbon;

class DemoPurchaseSeeder extends Seeder
{
    public function run(): void
    {
        $vendors = Contact::where('type', 'vendor')->get()->keyBy('name');

        // [vendor, products => [[sku, qty, cost, price]], payment, daysAgo]
        $purchases = [
            ['Tech Supplies Co',  [['SKU-1001', 5, 42000, 52000], ['SKU-1003', 8, 38000, 47500]], 'Cash',   55],
            ['Fresh Foods Ltd',   [['SKU-2001', 100, 80, 150], ['SKU-2003', 30, 650, 950], ['SKU-5001', 60, 160, 240]], 'Credit', 50],
            ['Garment World',     [['SKU-4001', 20, 450, 900], ['SKU-4003', 15, 650, 1250], ['SKU-4004', 10, 1200, 2400]], 'Cash', 48],
            ['Office Essentials', [['SKU-6001', 200, 20, 45], ['SKU-6002', 80, 120, 220]], 'Cash',   45],
            ['Fresh Foods Ltd',   [['SKU-3001', 80, 85, 160], ['SKU-3002', 30, 800, 1200], ['SKU-3003', 100, 120, 195]], 'Credit', 40],
            ['Tech Supplies Co',  [['SKU-1002', 8, 78000, 95000], ['SKU-1004', 20, 4500, 6800], ['SKU-1005', 25, 2800, 4200]], 'Credit', 38],
            ['Fresh Foods Ltd',   [['SKU-2004', 150, 35, 75], ['SKU-2005', 60, 180, 290], ['SKU-5002', 80, 55, 95]], 'Cash',   35],
            ['Garment World',     [['SKU-4002', 20, 450, 900]], 'Cash',                                                          32],
            ['Fresh Foods Ltd',   [['SKU-3004', 100, 200, 280], ['SKU-3005', 40, 420, 620], ['SKU-5003', 50, 380, 560]], 'Credit', 28],
            ['Office Essentials', [['SKU-6003', 20, 280, 450]], 'Cash',                                                          25],
            ['Tech Supplies Co',  [['SKU-1001', 10, 42000, 52000]], 'Cash',                                                      20],
            ['Fresh Foods Ltd',   [['SKU-2001', 200, 80, 150], ['SKU-2002', 100, 180, 320]], 'Credit',                          18],
            ['Fresh Foods Ltd',   [['SKU-3001', 100, 85, 160], ['SKU-3003', 120, 120, 195]], 'Cash',                            12],
            ['Tech Supplies Co',  [['SKU-1003', 15, 38000, 47500], ['SKU-1004', 30, 4500, 6800]], 'Credit',                      7],
            ['Fresh Foods Ltd',   [['SKU-5001', 80, 160, 240], ['SKU-5002', 100, 55, 95]], 'Cash',                               3],
        ];

        foreach ($purchases as $i => [$vendorName, $items, $payMethod, $daysAgo]) {
            $vendor  = $vendors[$vendorName] ?? null;
            if (!$vendor) continue;

            $date = Carbon::now()->subDays($daysAgo)->toDateString();

            $totalAmount = 0;
            $itemData    = [];

            foreach ($items as [$sku, $qty, $cost, $price]) {
                $product = Product::where('sku', $sku)->first();
                if (!$product) continue;
                $batch = ProductBatch::where('product_id', $product->id)->first();
                $lineTotal    = $qty * $cost;
                $totalAmount += $lineTotal;
                $itemData[]   = compact('product', 'batch', 'qty', 'cost', 'price', 'date', 'lineTotal');
            }

            $amountPaid    = $payMethod === 'Cash' ? $totalAmount : 0;
            $paymentStatus = $payMethod === 'Cash' ? 'paid' : 'partial';

            $purchase = Purchase::create([
                'store_id'       => 1,
                'contact_id'     => $vendor->id,
                'purchase_date'  => $date,
                'reference_no'   => 'PO-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                'total_amount'   => $totalAmount,
                'discount'       => 0,
                'profit_amount'  => 0,
                'amount_paid'    => $amountPaid,
                'payment_status' => $paymentStatus,
                'status'         => 'completed',
                'note'           => null,
                'created_by'     => 1,
            ]);

            foreach ($itemData as $item) {
                PurchaseItem::create([
                    'purchase_id'  => $purchase->id,
                    'product_id'   => $item['product']->id,
                    'batch_id'     => $item['batch']?->id,
                    'purchase_date'=> $item['date'],
                    'quantity'     => $item['qty'],
                    'unit_price'   => $item['price'],
                    'unit_cost'    => $item['cost'],
                    'discount'     => 0,
                    'created_by'   => 1,
                ]);
            }

            PurchaseTransaction::create([
                'purchase_id'      => $purchase->id,
                'store_id'         => 1,
                'contact_id'       => $vendor->id,
                'transaction_date' => $date,
                'amount'           => $amountPaid > 0 ? $amountPaid : $totalAmount,
                'payment_method'   => $payMethod,
                'transaction_type' => 'purchase',
                'created_by'       => 1,
            ]);
        }

        $this->command->info('Purchases seeded: ' . count($purchases));
    }
}
