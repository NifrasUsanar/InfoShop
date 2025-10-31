<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductStock;
use App\Models\Contact;
use App\Models\Charge;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SyncController extends Controller
{
    private const ALLOWED_TABLES = ['products', 'contacts', 'charges', 'stock', 'sales'];

    /**
     * Health check
     */
    public function healthCheck()
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * GET /api/sync?table=products&last_sync=1761865748538&store_id=1
     */
    public function fetch(Request $request)
    {
        $table = $request->query('table');

        if (!$table || !in_array($table, self::ALLOWED_TABLES)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid table. Allowed: ' . implode(', ', self::ALLOWED_TABLES),
            ], 400);
        }

        return match($table) {
            'products' => $this->getProducts($request),
            'contacts' => $this->getContacts($request),
            'charges' => $this->getCharges($request),
            'stock' => $this->getStock($request),
            'sales' => $this->getSales($request),
        };
    }

    /**
     * POST /api/sync?table=sales
     */
    public function push(Request $request)
    {
        $table = $request->query('table');

        return match($table) {
            'sales' => $this->syncSales($request),
            'transactions' => $this->syncTransactions($request),
            'contacts' => $this->syncContacts($request),
            'stock' => $this->syncStock($request),
            default => response()->json(['status' => 'error', 'message' => 'Invalid table'], 400),
        };
    }

    /**
     * Get products with flat structure
     */
    private function getProducts(Request $request)
    {
        $storeId = $request->query('store_id', 1);
        $lastSync = $this->parseTimestamp($request->query('last_sync'));

        $query = Product::query()
            ->select(
                'products.id',
                DB::raw("{$storeId} AS store_id"),
                'products.name',
                'products.description',
                'products.sku',
                'products.barcode',
                'products.image_url',
                'products.unit',
                'products.alert_quantity',
                'products.is_stock_managed',
                'products.is_active',
                'products.category_id',
                'products.product_type',
                'products.meta_data',
                'products.created_at',
                'products.updated_at',
                'pb.id AS batch_id',
                'pb.is_featured',
                DB::raw("COALESCE(pb.batch_number, 'N/A') AS batch_number"),
                'pb.cost',
                'pb.price',
                'pb.discount',
                'pb.discount_percentage',
                DB::raw("COALESCE(product_stocks.quantity, 0) AS quantity"),
                DB::raw("COALESCE(product_stocks.quantity, 0) AS stock_quantity")
            )
            ->leftJoin('product_batches AS pb', 'products.id', '=', 'pb.product_id')
            ->leftJoin('product_stocks', function($join) use ($storeId) {
                $join->on('pb.id', '=', 'product_stocks.batch_id')
                     ->where('product_stocks.store_id', '=', $storeId);
            })
            ->where('pb.is_active', 1);

        if ($lastSync) {
            $query->where(function($q) use ($lastSync) {
                $q->where('products.updated_at', '>=', $lastSync)
                  ->orWhere('pb.updated_at', '>=', $lastSync)
                  ->orWhere('product_stocks.updated_at', '>=', $lastSync);
            });
        }

        $products = $query->get()->map(function ($product) {
            return [
                'id' => $product->id,
                'store_id' => (string) $product->store_id,
                'name' => $product->name,
                'description' => $product->description,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'image_url' => $product->image_url,
                'unit' => $product->unit,
                'alert_quantity' => (int) $product->alert_quantity,
                'is_stock_managed' => (bool) $product->is_stock_managed,
                'is_active' => (bool) $product->is_active,
                'is_featured' => (bool) ($product->is_featured ?? 0),
                'category_id' => $product->category_id,
                'product_type' => $product->product_type,
                'meta_data' => $product->meta_data,
                'batch_id' => $product->batch_id,
                'batch_number' => $product->batch_number,
                'cost' => (float) ($product->cost ?? 0),
                'price' => (float) ($product->price ?? 0),
                'discount' => (float) ($product->discount ?? 0),
                'discount_percentage' => (float) ($product->discount_percentage ?? 0),
                'quantity' => (float) $product->quantity,
                'stock_quantity' => (float) $product->stock_quantity,
                'created_at' => $product->created_at instanceof \Carbon\Carbon
                    ? $product->created_at->toIso8601String()
                    : \Carbon\Carbon::parse($product->created_at)->toIso8601String(),
                'updated_at' => $product->updated_at instanceof \Carbon\Carbon
                    ? $product->updated_at->toIso8601String()
                    : \Carbon\Carbon::parse($product->updated_at)->toIso8601String(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $products,
            'count' => $products->count(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get contacts
     */
    private function getContacts(Request $request)
    {
        $storeId = $request->query('store_id', 1);
        $lastSync = $this->parseTimestamp($request->query('last_sync'));

        $query = Contact::query();

        if ($lastSync) {
            $query->where('updated_at', '>=', $lastSync);
        }

        $contacts = $query->get()->map(function ($contact) use ($storeId) {
            return [
                'id' => $contact->id,
                'store_id' => (string) $storeId, // Use store_id from request
                'name' => $contact->name,
                'email' => $contact->email,
                'phone' => $contact->phone,
                'contact_type' => $contact->contact_type ?? $contact->type, // Handle both column names
                'address' => $contact->address,
                'balance' => (float) ($contact->balance ?? 0),
                'created_at' => $contact->created_at instanceof \Carbon\Carbon
                    ? $contact->created_at->toIso8601String()
                    : \Carbon\Carbon::parse($contact->created_at)->toIso8601String(),
                'updated_at' => $contact->updated_at instanceof \Carbon\Carbon
                    ? $contact->updated_at->toIso8601String()
                    : \Carbon\Carbon::parse($contact->updated_at)->toIso8601String(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $contacts,
            'count' => $contacts->count(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get charges
     */
    private function getCharges(Request $request)
    {
        $storeId = $request->query('store_id', 1);
        $lastSync = $this->parseTimestamp($request->query('last_sync'));

        $query = Charge::query()->where('is_active', true);

        if ($lastSync) {
            $query->where('updated_at', '>=', $lastSync);
        }

        $charges = $query->get()->map(function ($charge) use ($storeId) {
            return [
                'id' => $charge->id,
                'store_id' => (string) $storeId, // Use store_id from request
                'name' => $charge->name,
                'charge_type' => $charge->charge_type,
                'rate_value' => (float) $charge->rate_value,
                'rate_type' => $charge->rate_type,
                'description' => $charge->description,
                'is_active' => (bool) $charge->is_active,
                'is_default' => (bool) $charge->is_default,
                'created_at' => $charge->created_at instanceof \Carbon\Carbon
                    ? $charge->created_at->toIso8601String()
                    : \Carbon\Carbon::parse($charge->created_at)->toIso8601String(),
                'updated_at' => $charge->updated_at instanceof \Carbon\Carbon
                    ? $charge->updated_at->toIso8601String()
                    : \Carbon\Carbon::parse($charge->updated_at)->toIso8601String(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $charges,
            'count' => $charges->count(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get sales
     */
    private function getSales(Request $request)
    {
        $storeId = $request->query('store_id');
        $lastSync = $this->parseTimestamp($request->query('last_sync'));

        $query = Sale::query();

        if ($storeId) {
            $query->where('store_id', $storeId);
        }

        if ($lastSync) {
            $query->where('updated_at', '>=', $lastSync);
        }

        $sales = $query->with('items')->get()->map(function ($sale) {
            return [
                'id' => $sale->id,
                'store_id' => (string) $sale->store_id,
                'contact_id' => $sale->contact_id,
                'invoice_number' => $sale->invoice_number,
                'sale_type' => $sale->sale_type,
                'reference_id' => $sale->reference_id,
                'total_amount' => (float) $sale->total_amount,
                'discount' => (float) $sale->discount,
                'amount_received' => (float) $sale->amount_received,
                'profit_amount' => (float) $sale->profit_amount,
                'status' => $sale->status,
                'payment_status' => $sale->payment_status,
                'payment_method' => $sale->payment_method,
                'note' => $sale->note,
                'sale_date' => $sale->sale_date ? Carbon::parse($sale->sale_date)->timestamp * 1000 : null,
                'sale_time' => $sale->sale_time,
                'total_charge_amount' => (float) ($sale->total_charge_amount ?? 0),
                'items' => $sale->items->toArray(),
                'created_at' => $sale->created_at instanceof \Carbon\Carbon
                    ? $sale->created_at->toIso8601String()
                    : \Carbon\Carbon::parse($sale->created_at)->toIso8601String(),
                'updated_at' => $sale->updated_at instanceof \Carbon\Carbon
                    ? $sale->updated_at->toIso8601String()
                    : \Carbon\Carbon::parse($sale->updated_at)->toIso8601String(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $sales,
            'count' => $sales->count(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get stock
     */
    private function getStock(Request $request)
    {
        $storeId = $request->query('store_id');

        if (!$storeId) {
            return response()->json(['status' => 'error', 'message' => 'store_id required'], 400);
        }

        $stock = ProductStock::where('store_id', $storeId)->get();

        return response()->json([
            'status' => 'success',
            'data' => $stock,
            'count' => $stock->count(),
        ]);
    }

    /**
     * Sync sales from mobile
     */
    private function syncSales(Request $request)
    {
        $storeId = $request->input('store_id');
        $sales = $request->input('sales', []);

        if (!$storeId || empty($sales)) {
            return response()->json(['status' => 'error', 'message' => 'store_id and sales required'], 400);
        }

        $synced = 0;

        DB::beginTransaction();
        try {
            foreach ($sales as $saleData) {
                $this->createOrUpdateSale($saleData, $storeId);
                $synced++;
            }
            DB::commit();

            return response()->json(['status' => 'success', 'synced' => $synced]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Sync transactions from mobile
     */
    private function syncTransactions(Request $request)
    {
        $storeId = $request->input('store_id');
        $transactions = $request->input('transactions', []);

        if (!$storeId || empty($transactions)) {
            return response()->json(['status' => 'error', 'message' => 'store_id and transactions required'], 400);
        }

        $synced = 0;

        DB::beginTransaction();
        try {
            foreach ($transactions as $txnData) {
                Transaction::updateOrCreate(
                    ['id' => $txnData['id'] ?? null],
                    [
                        'sales_id' => $txnData['sales_id'] ?? null,
                        'store_id' => $storeId,
                        'contact_id' => $txnData['contact_id'],
                        'transaction_date' => isset($txnData['transaction_date']) 
                            ? $this->parseTimestamp($txnData['transaction_date']) 
                            : now(),
                        'amount' => $txnData['amount'],
                        'payment_method' => $txnData['payment_method'] ?? 'Cash',
                        'transaction_type' => $txnData['transaction_type'] ?? 'account',
                        'note' => $txnData['note'] ?? null,
                    ]
                );
                $synced++;
            }
            DB::commit();

            return response()->json(['status' => 'success', 'synced' => $synced]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Sync contacts from mobile
     */
    private function syncContacts(Request $request)
    {
        $contacts = $request->input('contacts', []);

        if (empty($contacts)) {
            return response()->json(['status' => 'error', 'message' => 'contacts required'], 400);
        }

        $synced = 0;

        DB::beginTransaction();
        try {
            foreach ($contacts as $contactData) {
                Contact::updateOrCreate(
                    ['id' => $contactData['id'] ?? null],
                    [
                        'name' => $contactData['name'],
                        'email' => $contactData['email'] ?? null,
                        'phone' => $contactData['phone'] ?? null,
                        'address' => $contactData['address'] ?? null,
                        'contact_type' => $contactData['contact_type'] ?? 'customer',
                    ]
                );
                $synced++;
            }
            DB::commit();

            return response()->json(['status' => 'success', 'synced' => $synced]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Sync stock from mobile
     */
    private function syncStock(Request $request)
    {
        $storeId = $request->input('store_id');
        $updates = $request->input('updates', []);

        if (!$storeId || empty($updates)) {
            return response()->json(['status' => 'error', 'message' => 'store_id and updates required'], 400);
        }

        $updated = 0;

        DB::beginTransaction();
        try {
            foreach ($updates as $update) {
                ProductStock::updateOrCreate(
                    [
                        'product_id' => $update['product_id'],
                        'batch_id' => $update['batch_id'],
                        'store_id' => $storeId,
                    ],
                    ['quantity' => $update['quantity']]
                );
                $updated++;
            }
            DB::commit();

            return response()->json(['status' => 'success', 'updated' => $updated]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Create or update sale
     */
    private function createOrUpdateSale($saleData, $storeId)
    {
        $sale = Sale::updateOrCreate(
            ['id' => $saleData['id'] ?? null],
            [
                'invoice_number' => $saleData['invoice_number'] ?? null,
                'store_id' => $storeId,
                'contact_id' => $saleData['contact_id'] ?? null,
                'sale_type' => $saleData['sale_type'] ?? 'normal',
                'total_amount' => $saleData['total_amount'],
                'discount' => $saleData['discount'] ?? 0,
                'amount_received' => $saleData['amount_received'],
                'profit_amount' => $saleData['profit_amount'] ?? 0,
                'status' => $saleData['status'] ?? 'completed',
                'payment_status' => $saleData['payment_status'] ?? 'completed',
                'payment_method' => $saleData['payment_method'] ?? null,
                'note' => $saleData['note'] ?? null,
                'sale_date' => isset($saleData['sale_date']) 
                    ? $this->parseTimestamp($saleData['sale_date']) 
                    : now(),
                'sale_time' => $saleData['sale_time'] ?? now()->format('H:i:s'),
                'total_charge_amount' => $saleData['total_charge_amount'] ?? 0,
            ]
        );

        // Handle items
        if (isset($saleData['items'])) {
            $items = is_string($saleData['items']) ? json_decode($saleData['items'], true) : $saleData['items'];

            foreach ($items as $itemData) {
                SaleItem::updateOrCreate(
                    [
                        'sale_id' => $sale->id,
                        'product_id' => $itemData['product_id'] ?? null,
                    ],
                    [
                        'batch_id' => $itemData['batch_id'] ?? null,
                        'quantity' => $itemData['quantity'] ?? 0,
                        'unit_price' => $itemData['unit_price'] ?? 0,
                        'item_type' => $itemData['item_type'] ?? 'product',
                        'charge_id' => $itemData['charge_id'] ?? null,
                    ]
                );
            }
        }

        return $sale;
    }

    /**
     * Parse timestamp - handles milliseconds from JavaScript
     */
    private function parseTimestamp($timestamp)
    {
        if (!$timestamp) {
            return null;
        }

        // If numeric and > 10 digits, it's milliseconds - convert to seconds
        if (is_numeric($timestamp) && $timestamp > 9999999999) {
            $timestamp = intval($timestamp / 1000);
        }

        // If still numeric, create from Unix timestamp
        if (is_numeric($timestamp)) {
            return Carbon::createFromTimestamp($timestamp);
        }

        // Otherwise parse as date string
        return Carbon::parse($timestamp);
    }
}
