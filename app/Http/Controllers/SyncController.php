<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductStock;
use App\Models\Contact;
use App\Models\Charge;
use App\Models\Collection;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class SyncController extends Controller
{
    private const ALLOWED_TABLES = ['products', 'contacts', 'charges', 'collections', 'stock', 'sales'];

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
            'collections' => $this->getCollections($request),
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
                DB::raw("COALESCE(product_stocks.quantity, 0) AS stock_quantity"),
                DB::raw("GREATEST(
                    products.updated_at,
                    pb.updated_at,
                    COALESCE(product_stocks.updated_at, '1970-01-01')
                ) AS last_modified"),
                // Get first collection_id from pivot table
                DB::raw("(SELECT collection_id FROM collection_product WHERE collection_product.product_id = products.id LIMIT 1) AS collection_id")
            )
            ->leftJoin('product_batches AS pb', 'products.id', '=', 'pb.product_id')
            ->leftJoin('product_stocks', function($join) use ($storeId) {
                $join->on('pb.id', '=', 'product_stocks.batch_id')
                     ->where('product_stocks.store_id', '=', $storeId);
            })
            ->where('pb.is_active', 1);

        if ($lastSync) {
            $lastSyncStr = $lastSync->toDateTimeString();
            $query->where(function($q) use ($lastSyncStr) {
                $q->whereRaw('products.updated_at >= ?', [$lastSyncStr])
                  ->orWhereRaw('pb.updated_at >= ?', [$lastSyncStr])
                  ->orWhereRaw('product_stocks.updated_at >= ?', [$lastSyncStr]);
            });
        }

        $products = $query->get()->map(function ($product) {
            // Convert image_url to storage URL
            $imageUrl = $product->image_url;
            if (!empty($imageUrl)) {
                $imageUrl = Storage::url($imageUrl);
            }

            return [
                'id' => $product->id,
                'store_id' => (string) $product->store_id,
                'name' => $product->name,
                'description' => $product->description,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
                'image_url' => $imageUrl,
                'unit' => $product->unit,
                'alert_quantity' => (int) $product->alert_quantity,
                'is_stock_managed' => (bool) $product->is_stock_managed,
                'is_active' => (bool) $product->is_active,
                'is_featured' => (bool) ($product->is_featured ?? 0),
                'category_id' => $product->category_id,
                'collection_id' => $product->collection_id,
                'product_type' => $product->product_type,
                'meta_data' => $product->meta_data,
                'batch_id' => $product->batch_id,
                'batch_number' => $product->batch_number,
                'cost' => (float) ($product->cost ?? 0),
                'price' => (float) ($product->price ?? 0),
                'discount' => (float) ($product->discount ?? 0),
                'discount_percentage' => (float) ($product->discount_percentage ?? 0),
                'quantity' => (float) $product->stock_quantity,
                'stock_quantity' => (float) $product->stock_quantity,
                'created_at' => $product->created_at instanceof Carbon
                    ? (int) ($product->created_at->getTimestamp() * 1000)
                    : (int) (Carbon::parse($product->created_at)->getTimestamp() * 1000),
                'updated_at' => isset($product->last_modified)
                    ? (int) (Carbon::parse($product->last_modified)->getTimestamp() * 1000)
                    : ($product->updated_at instanceof Carbon
                        ? (int) ($product->updated_at->getTimestamp() * 1000)
                        : (int) (Carbon::parse($product->updated_at)->getTimestamp() * 1000)),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $products,
            'count' => $products->count(),
            'timestamp' => (int) (now()->getTimestamp() * 1000),
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
            $query->whereRaw('updated_at >= ?', [$lastSync->toDateTimeString()]);
        }

        $contacts = $query->get()->map(function ($contact) use ($storeId) {
            return [
                'id' => (string) $contact->id,
                'store_id' => (string) $storeId,
                'name' => $contact->name,
                'email' => $contact->email,
                'phone' => $contact->phone,
                'type' => $contact->type ?? 'customer',
                'address' => $contact->address,
                'balance' => (float) ($contact->balance ?? 0),
                'created_at' => $contact->created_at instanceof Carbon
                    ? (int) ($contact->created_at->getTimestamp() * 1000)
                    : (int) (Carbon::parse($contact->created_at)->getTimestamp() * 1000),
                'updated_at' => $contact->updated_at instanceof Carbon
                    ? (int) ($contact->updated_at->getTimestamp() * 1000)
                    : (int) (Carbon::parse($contact->updated_at)->getTimestamp() * 1000),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $contacts,
            'count' => $contacts->count(),
            'timestamp' => (int) (now()->getTimestamp() * 1000),
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
            $query->whereRaw('updated_at >= ?', [$lastSync->toDateTimeString()]);
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
                'created_at' => $charge->created_at instanceof Carbon
                    ? (int) ($charge->created_at->getTimestamp() * 1000)
                    : (int) (Carbon::parse($charge->created_at)->getTimestamp() * 1000),
                'updated_at' => $charge->updated_at instanceof Carbon
                    ? (int) ($charge->updated_at->getTimestamp() * 1000)
                    : (int) (Carbon::parse($charge->updated_at)->getTimestamp() * 1000),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $charges,
            'count' => $charges->count(),
            'timestamp' => (int) (now()->getTimestamp() * 1000),
        ]);
    }

    /**
     * Get collections (categories, tags, brands)
     */
    private function getCollections(Request $request)
    {
        $storeId = $request->query('store_id', 1);
        $lastSync = $this->parseTimestamp($request->query('last_sync'));

        $query = Collection::query();

        if ($lastSync) {
            $query->whereRaw('updated_at >= ?', [$lastSync->toDateTimeString()]);
        }

        $collections = $query->with('children')->get()->map(function ($collection) use ($storeId) {
            return [
                'id' => $collection->id,
                'store_id' => (string) $storeId,
                'name' => $collection->name,
                'description' => $collection->description,
                'collection_type' => $collection->collection_type,
                'parent_id' => $collection->parent_id,
                'slug' => $collection->slug,
                'children' => $collection->children ? $collection->children->map(function ($child) {
                    return [
                        'id' => $child->id,
                        'name' => $child->name,
                        'description' => $child->description,
                        'collection_type' => $child->collection_type,
                        'parent_id' => $child->parent_id,
                        'slug' => $child->slug,
                    ];
                })->toArray() : [],
                'created_at' => $collection->created_at instanceof Carbon
                    ? (int) ($collection->created_at->getTimestamp() * 1000)
                    : (int) (Carbon::parse($collection->created_at)->getTimestamp() * 1000),
                'updated_at' => $collection->updated_at instanceof Carbon
                    ? (int) ($collection->updated_at->getTimestamp() * 1000)
                    : (int) (Carbon::parse($collection->updated_at)->getTimestamp() * 1000),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $collections,
            'count' => $collections->count(),
            'timestamp' => (int) (now()->getTimestamp() * 1000),
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
            $query->whereRaw('updated_at >= ?', [$lastSync->toDateTimeString()]);
        }

        $sales = $query->with(['items.product', 'items.charge', 'transactions'])->get()->map(function ($sale) {
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
                'note' => $sale->note,
                'sale_date' => $sale->sale_date instanceof Carbon
                    ? (int) ($sale->sale_date->getTimestamp() * 1000)
                    : (int) (Carbon::parse($sale->sale_date)->getTimestamp() * 1000),
                'sale_time' => $sale->sale_time,
                'total_charge_amount' => (float) ($sale->total_charge_amount ?? 0),
                'items' => $sale->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'batch_id' => $item->batch_id,
                        'name' => $item->item_type === 'charge'
                            ? ($item->charge->name ?? $item->description ?? 'Charge')
                            : ($item->product->name ?? $item->description ?? 'Unknown Product'),
                        'quantity' => (float) $item->quantity,
                        'price' => (float) $item->unit_price,
                        'unit_price' => (float) $item->unit_price,
                        'unit_cost' => (float) $item->unit_cost,
                        'discount' => (float) $item->discount,
                        'flat_discount' => (float) ($item->flat_discount ?? 0),
                        'item_type' => $item->item_type,
                        'charge_id' => $item->charge_id,
                        'charge_type' => $item->charge_type,
                        'rate_value' => $item->rate_value,
                        'rate_type' => $item->rate_type,
                    ];
                })->toArray(),
                'transactions' => $sale->transactions->map(function ($txn) {
                    return [
                        'id' => $txn->id,
                        'sales_id' => $txn->sales_id,
                        'store_id' => (string) $txn->store_id,
                        'contact_id' => $txn->contact_id,
                        'transaction_date' => $txn->transaction_date instanceof Carbon
                            ? (int) ($txn->transaction_date->getTimestamp() * 1000)
                            : (int) (Carbon::parse($txn->transaction_date)->getTimestamp() * 1000),
                        'amount' => (float) $txn->amount,
                        'payment_method' => $txn->payment_method,
                        'transaction_type' => $txn->transaction_type,
                        'note' => $txn->note,
                        'parent_id' => $txn->parent_id,
                        'created_at' => $txn->created_at instanceof Carbon
                            ? (int) ($txn->created_at->getTimestamp() * 1000)
                            : (int) (Carbon::parse($txn->created_at)->getTimestamp() * 1000),
                        'updated_at' => $txn->updated_at instanceof Carbon
                            ? (int) ($txn->updated_at->getTimestamp() * 1000)
                            : (int) (Carbon::parse($txn->updated_at)->getTimestamp() * 1000),
                    ];
                })->toArray(),
                'created_at' => $sale->created_at instanceof Carbon
                    ? (int) ($sale->created_at->getTimestamp() * 1000)
                    : (int) (Carbon::parse($sale->created_at)->getTimestamp() * 1000),
                'updated_at' => $sale->updated_at instanceof Carbon
                    ? (int) ($sale->updated_at->getTimestamp() * 1000)
                    : (int) (Carbon::parse($sale->updated_at)->getTimestamp() * 1000),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $sales,
            'count' => $sales->count(),
            'timestamp' => (int) (now()->getTimestamp() * 1000),
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
        $errors = [];

        foreach ($sales as $saleData) {
            try {
                $this->createOrUpdateSale($saleData, $storeId);
                $synced++;
            } catch (\Exception $e) {
                $errors[] = [
                    'invoice_number' => $saleData['invoice_number'] ?? 'unknown',
                    'error' => $e->getMessage()
                ];
            }
        }

        return response()->json([
            'status' => empty($errors) ? 'success' : 'partial',
            'synced' => $synced,
            'errors' => $errors
        ]);
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
                        'type' => $contactData['type'] ?? 'customer',
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
     * Create or update sale by delegating to POSController checkout
     */
    private function createOrUpdateSale($saleData, $storeId)
    {
        // Check if sale already exists by sync_id (Firebase invoice number)
        $existingSale = Sale::where('sync_id', $saleData['invoice_number'])->first();

        if ($existingSale) {
            // Sale already synced, skip
            return $existingSale;
        }

        // Transform offline sale data to match checkout request format
        $checkoutRequest = new Request();

        // Parse items
        $items = isset($saleData['items'])
            ? (is_string($saleData['items']) ? json_decode($saleData['items'], true) : $saleData['items'])
            : [];

        // Separate product items and charges based on item_type
        $cartItems = [];
        $charges = [];

        foreach ($items as $item) {
            if (isset($item['item_type']) && $item['item_type'] === 'charge') {
                // This is a charge item
                $charges[] = [
                    'id' => $item['charge_id'] ?? null,
                    'name' => $item['name'] ?? 'Charge',
                    'charge_type' => $item['charge_type'] ?? 'tax',
                    'rate_value' => $item['rate_value'] ?? 0,
                    'rate_type' => $item['rate_type'] ?? 'percentage',
                ];
            } else {
                // This is a product item - map all fields correctly
                $cartItems[] = [
                    'id' => $item['id'] ?? $item['product_id'] ?? null,
                    'batch_id' => $item['batch_id'] ?? null,
                    'quantity' => $item['quantity'] ?? 0,
                    'price' => $item['price'] ?? $item['unit_price'] ?? 0,
                    'cost' => $item['cost'] ?? $item['unit_cost'] ?? 0,
                    'discount' => $item['discount'] ?? 0,
                    'flat_discount' => $item['flat_discount'] ?? 0,
                    'is_stock_managed' => $item['is_stock_managed'] ?? 1,
                    'is_free' => $item['is_free'] ?? 0,
                    'free_quantity' => $item['free_quantity'] ?? 0,
                    'category_name' => $item['category_name'] ?? null,
                    'product_type' => $item['product_type'] ?? 'normal',
                ];
            }
        }

        // Map transactions to payments format
        $transactions = $saleData['transactions'] ?? [];
        $payments = [];

        foreach ($transactions as $txn) {
            $payments[] = [
                'payment_method' => $txn['payment_method'] ?? $txn['paymentMethod'] ?? 'Cash',
                'amount' => $txn['amount'] ?? 0,
            ];
        }

        // Build checkout request data
        $requestData = [
            'store_id' => $storeId, // Include store_id in request
            'created_by' => $saleData['created_by'] ?? 1, // Default to user ID 1 if not provided
            'sync_id' => $saleData['invoice_number'], // Map Firebase invoice to sync_id
            'contact_id' => $saleData['contact_id'] ?? null,
            'sale_date' => isset($saleData['sale_date'])
                ? $this->parseTimestamp($saleData['sale_date'])->toDateString()
                : now()->toDateString(),
            'net_total' => $saleData['total_amount'],
            'discount' => $saleData['discount'] ?? 0,
            'amount_received' => $saleData['amount_received'] ?? 0,
            'profit_amount' => $saleData['profit_amount'] ?? 0,
            'note' => $saleData['note'] ?? null,
            'cartItems' => $cartItems,
            'charges' => $charges,
            'payment_method' => empty($payments) ? 'Cash' : null, // Only set default if no payments
            'return_sale' => ($saleData['sale_type'] ?? 'normal') === 'return',
            'return_sale_id' => $saleData['reference_id'] ?? null,
            'payments' => $payments, // Mapped from transactions
        ];

        // Create request with data
        $checkoutRequest->replace($requestData);

        // Call POSController checkout method
        $posController = new POSController();
        $response = $posController->checkout($checkoutRequest);

        // Check if response is successful
        $responseData = $response->getData();

        if (isset($responseData->error)) {
            $errorMessage = is_string($responseData->error)
                ? $responseData->error
                : json_encode($responseData->error);
            throw new \Exception($errorMessage);
        }

        return Sale::find($responseData->sale_id);
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

        // If still numeric, create from Unix timestamp and convert to server timezone
        if (is_numeric($timestamp)) {
            return Carbon::createFromTimestamp($timestamp)->timezone(config('app.timezone'));
        }

        // Otherwise parse as date string in server timezone
        return Carbon::parse($timestamp)->timezone(config('app.timezone'));
    }
}
