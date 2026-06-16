<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductStock;
use App\Models\Collection;
use Illuminate\Support\Facades\DB;

class DemoProductSeeder extends Seeder
{
    public function run(): void
    {
        $cat  = Collection::where('collection_type', 'category')->pluck('id', 'name');
        $brand = Collection::where('collection_type', 'brand')->pluck('id', 'name');

        // [name, sku, unit, category, brand, cost, price, stock, alert_qty, is_featured]
        $products = [
            // Electronics
            ['Samsung Galaxy A15', 'SKU-1001', 'PC',  'Electronics', 'Samsung',   42000, 52000,  30,  5,  true],
            ['Samsung Galaxy A35', 'SKU-1002', 'PC',  'Electronics', 'Samsung',   78000, 95000,  20,  3,  true],
            ['Apple AirPods Pro',  'SKU-1003', 'PC',  'Electronics', 'Apple',     38000, 47500,  25,  5,  true],
            ['JBL Wireless Earbuds','SKU-1004','PC',  'Electronics', 'Local Brand', 4500, 6800,  50,  10, false],
            ['Power Bank 20000mAh','SKU-1005', 'PC',  'Electronics', 'Local Brand', 2800, 4200,  45,  10, false],

            // Beverages
            ['Coca-Cola 330ml',    'SKU-2001', 'CAN', 'Beverages',   'Coca-Cola',   80,   150,  200, 20, true],
            ['Coca-Cola 1.5L',     'SKU-2002', 'BTL', 'Beverages',   'Coca-Cola',  180,   320,  150, 20, true],
            ['Milo 400g Tin',      'SKU-2003', 'TIN', 'Beverages',   'Nestle',     650,   950,  100, 15, false],
            ['Water 500ml',        'SKU-2004', 'BTL', 'Beverages',   'Local Brand',  35,    75,  300, 30, false],
            ['Orange Juice 1L',    'SKU-2005', 'BTL', 'Beverages',   'Local Brand', 180,   290,  120, 20, false],

            // Groceries
            ['Bread Loaf',         'SKU-3001', 'PC',  'Groceries',   'Local Brand',  85,   160,  150, 20, true],
            ['Rice 5kg',           'SKU-3002', 'BAG', 'Groceries',   'Local Brand', 800,  1200,  80,  10, true],
            ['Nestle Biscuits',    'SKU-3003', 'PKT', 'Groceries',   'Nestle',      120,   195,  200, 25, false],
            ['Sugar 1kg',          'SKU-3004', 'PKG', 'Groceries',   'Local Brand', 200,   280,  180, 20, false],
            ['Coconut Oil 500ml',  'SKU-3005', 'BTL', 'Groceries',   'Local Brand', 420,   620,   90, 15, false],

            // Clothing
            ['Men\'s T-Shirt (M)', 'SKU-4001', 'PC',  'Clothing',    'Local Brand', 450,   900,  60,  10, true],
            ['Men\'s T-Shirt (L)', 'SKU-4002', 'PC',  'Clothing',    'Local Brand', 450,   900,  60,  10, false],
            ['Ladies Blouse',      'SKU-4003', 'PC',  'Clothing',    'Local Brand', 650,  1250,  40,  8,  true],
            ['Denim Jeans',        'SKU-4004', 'PC',  'Clothing',    'Local Brand',1200,  2400,  35,  5,  false],

            // Dairy
            ['Fresh Milk 1L',      'SKU-5001', 'BTL', 'Dairy',       'Local Brand', 160,   240,  100, 15, true],
            ['Yogurt 200g',        'SKU-5002', 'CUP', 'Dairy',       'Unilever',     55,    95,  120, 20, false],
            ['Cheese Slice 200g',  'SKU-5003', 'PKT', 'Dairy',       'Unilever',    380,   560,   80, 10, false],

            // Stationery
            ['Ballpoint Pen',      'SKU-6001', 'PC',  'Stationery',  'Local Brand',   20,    45, 500, 50, false],
            ['Notebook A4',        'SKU-6002', 'PC',  'Stationery',  'Local Brand',  120,   220, 200, 25, true],
            ['Stapler',            'SKU-6003', 'PC',  'Stationery',  'Local Brand',  280,   450,  50,  8, false],
        ];

        DB::beginTransaction();
        try {
            foreach ($products as $index => [$name, $sku, $unit, $catName, $brandName, $cost, $price, $stock, $alertQty, $featured]) {
                $product = Product::create([
                    'name'            => $name,
                    'sku'             => $sku,
                    'barcode'         => '600' . str_pad($index + 1, 9, '0', STR_PAD_LEFT),
                    'unit'            => $unit,
                    'category_id'     => $cat[$catName] ?? null,
                    'brand_id'        => $brand[$brandName] ?? null,
                    'alert_quantity'  => $alertQty,
                    'is_active'       => true,
                    'is_featured'     => $featured,
                    'is_stock_managed'=> true,
                    'quantity'        => $stock,
                    'created_by'      => 1,
                ]);

                $batch = ProductBatch::create([
                    'product_id'   => $product->id,
                    'batch_number' => 'DEFAULT',
                    'cost'         => $cost,
                    'price'        => $price,
                    'discount'     => 0,
                    'is_active'    => true,
                    'is_featured'  => $featured,
                    'created_by'   => 1,
                ]);

                ProductStock::create([
                    'store_id'   => 1,
                    'product_id' => $product->id,
                    'batch_id'   => $batch->id,
                    'quantity'   => $stock,
                    'created_by' => 1,
                ]);

                // Assign to category collection
                if (isset($cat[$catName])) {
                    DB::table('collection_product')->insert([
                        'collection_id' => $cat[$catName],
                        'product_id'    => $product->id,
                    ]);
                }

                // Assign to brand collection
                if (isset($brand[$brandName])) {
                    DB::table('collection_product')->insert([
                        'collection_id' => $brand[$brandName],
                        'product_id'    => $product->id,
                    ]);
                }
            }

            DB::commit();
            $this->command->info('Products seeded: ' . count($products) . ' items');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Product seeding failed: ' . $e->getMessage());
        }
    }
}
