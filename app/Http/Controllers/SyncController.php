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
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SyncController extends Controller
{
    /**
     * Health check endpoint
     */
    public function healthCheck()
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
            'version' => config('app.version', '1.0'),
        ]);
    }

    /**
     * Get products for sync
     * Supports incremental sync via last_sync timestamp
     */
    public function getProducts(Request $request)
    {
        $storeId = $request->query('store_id');
        $lastSync = $request->query('last_sync');

        $query = Product::query()
            ->with('batches.stocks')
            ->where('is_active', true);

        if ($storeId) {
            $query->whereHas('batches.stocks', function ($q) use ($storeId) {
                $q->where('store_id', $storeId);
            });
        }

        if ($lastSync) {
            $lastSyncTime = Carbon::parse($lastSync);
            $query->where(function ($q) use ($lastSyncTime) {
                $q->where('updated_at', '>=', $lastSyncTime)
                  ->orWhereHas('batches', function ($batch) use ($lastSyncTime) {
                      $batch->where('updated_at', '>=', $lastSyncTime);
                  });
            });
        }

        $products = $query->get()->map(function ($product) use ($storeId) {
            return $this->formatProduct($product, $storeId);
        });

        return response()->json([
            'status' => 'success',
            'data' => $products,
            'count' => $products->count(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get contacts (customers and vendors) for sync
     */
    public function getContacts(Request $request)
    {
        $storeId = $request->query('store_id');
        $lastSync = $request->query('last_sync');

        $query = Contact::query();

        if ($lastSync) {
            $lastSyncTime = Carbon::parse($lastSync);
            $query->where('updated_at', '>=', $lastSyncTime);
        }

        $contacts = $query->get()->map(function ($contact) {
            return [
                'id' => $contact->id,
                'name' => $contact->name,
                'email' => $contact->email,
                'phone' => $contact->phone,
                'contact_type' => $contact->contact_type,
                'address' => $contact->address,
                'city' => $contact->city,
                'balance' => (float) $contact->balance,
                'is_active' => (bool) $contact->is_active,
                'created_at' => $this->formatTimestamp($contact->created_at),
                'updated_at' => $this->formatTimestamp($contact->updated_at),
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
     * Get charges for sync
     */
    public function getCharges(Request $request)
    {
        $lastSync = $request->query('last_sync');

        $query = Charge::query()->where('is_active', true);

        if ($lastSync) {
            $lastSyncTime = Carbon::parse($lastSync);
            $query->where('updated_at', '>=', $lastSyncTime);
        }

        $charges = $query->get()->map(function ($charge) {
            return [
                'id' => $charge->id,
                'name' => $charge->name,
                'charge_type' => $charge->charge_type,
                'rate_value' => (float) $charge->rate_value,
                'rate_type' => $charge->rate_type,
                'description' => $charge->description,
                'is_active' => (bool) $charge->is_active,
                'is_default' => (bool) $charge->is_default,
                'created_at' => $this->formatTimestamp($charge->created_at),
                'updated_at' => $this->formatTimestamp($charge->updated_at),
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
     * Get stock information for a store
     */
    public function getStock(Request $request)
    {
        $storeId = $request->query('store_id');

        if (!$storeId) {
            return response()->json([
                'status' => 'error',
                'message' => 'store_id is required',
            ], 400);
        }

        $stock = ProductStock::query()
            ->where('store_id', $storeId)
            ->with('product', 'batch')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'batch_id' => $item->batch_id,
                    'store_id' => $item->store_id,
                    'quantity' => (int) $item->quantity,
                    'created_at' => $this->formatTimestamp($item->created_at),
                    'updated_at' => $this->formatTimestamp($item->updated_at),
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $stock,
            'count' => $stock->count(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Sync sales from offline app
     */
    public function syncSales(Request $request)
    {
        $storeId = $request->input('store_id');
        $sales = $request->input('sales', []);

        if (!$storeId || empty($sales)) {
            return response()->json([
                'status' => 'error',
                'message' => 'store_id and sales are required',
            ], 400);
        }

        $synced = 0;
        $errors = [];

        DB::beginTransaction();

        try {
            foreach ($sales as $saleData) {
                try {
                    $this->createOrUpdateSale($saleData, $storeId);
                    $synced++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'sale_id' => $saleData['id'] ?? null,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => "Synced {$synced} sales",
                'synced' => $synced,
                'errors' => $errors,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Sync failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sync transactions from offline app
     */
    public function syncTransactions(Request $request)
    {
        $storeId = $request->input('store_id');
        $transactions = $request->input('transactions', []);

        if (!$storeId || empty($transactions)) {
            return response()->json([
                'status' => 'error',
                'message' => 'store_id and transactions are required',
            ], 400);
        }

        $synced = 0;
        $errors = [];

        DB::beginTransaction();

        try {
            foreach ($transactions as $txnData) {
                try {
                    $this->createOrUpdateTransaction($txnData, $storeId);
                    $synced++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'transaction_id' => $txnData['id'] ?? null,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => "Synced {$synced} transactions",
                'synced' => $synced,
                'errors' => $errors,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Sync failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sync contacts from offline app
     */
    public function syncContacts(Request $request)
    {
        $storeId = $request->input('store_id');
        $contacts = $request->input('contacts', []);

        if (!$storeId || empty($contacts)) {
            return response()->json([
                'status' => 'error',
                'message' => 'store_id and contacts are required',
            ], 400);
        }

        $synced = 0;
        $errors = [];

        DB::beginTransaction();

        try {
            foreach ($contacts as $contactData) {
                try {
                    Contact::updateOrCreate(
                        ['id' => $contactData['id'] ?? null],
                        [
                            'name' => $contactData['name'],
                            'email' => $contactData['email'] ?? null,
                            'phone' => $contactData['phone'] ?? null,
                            'address' => $contactData['address'] ?? null,
                            'contact_type' => $contactData['contact_type'] ?? 'customer',
                            'balance' => $contactData['balance'] ?? 0,
                            'is_active' => $contactData['is_active'] ?? true,
                        ]
                    );
                    $synced++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'contact_id' => $contactData['id'] ?? null,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => "Synced {$synced} contacts",
                'synced' => $synced,
                'errors' => $errors,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Contact sync failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sync stock updates from offline app
     */
    public function syncStock(Request $request)
    {
        $storeId = $request->input('store_id');
        $updates = $request->input('updates', []);

        if (!$storeId || empty($updates)) {
            return response()->json([
                'status' => 'error',
                'message' => 'store_id and updates are required',
            ], 400);
        }

        $updated = 0;
        $errors = [];

        DB::beginTransaction();

        try {
            foreach ($updates as $update) {
                try {
                    ProductStock::updateOrCreate(
                        [
                            'product_id' => $update['product_id'],
                            'batch_id' => $update['batch_id'],
                            'store_id' => $storeId,
                        ],
                        [
                            'quantity' => $update['quantity'],
                        ]
                    );
                    $updated++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'product_id' => $update['product_id'] ?? null,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => "Updated {$updated} stock items",
                'updated' => $updated,
                'errors' => $errors,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'status' => 'error',
                'message' => 'Stock sync failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get store configuration
     */
    public function getStoreConfig(Request $request, $storeId)
    {
        $store = Store::findOrFail($storeId);

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $store->id,
                'name' => $store->name,
                'address' => $store->address,
                'phone' => $store->phone,
                'email' => $store->email,
                'currency' => $store->currency ?? 'USD',
                'timezone' => $store->timezone ?? 'UTC',
                'created_at' => $this->formatTimestamp($store->created_at),
                'updated_at' => $this->formatTimestamp($store->updated_at),
            ],
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get full sync manifest
     * Returns metadata about all available data
     */
    public function getSyncManifest(Request $request)
    {
        $storeId = $request->query('store_id');

        $manifest = [
            'products' => Product::where('is_active', true)->count(),
            'contacts' => Contact::count(),
            'charges' => Charge::where('is_active', true)->count(),
            'sales' => Sale::where('store_id', $storeId)->count(),
            'transactions' => Transaction::where('store_id', $storeId)->count(),
        ];

        if ($storeId) {
            $manifest['stock'] = ProductStock::where('store_id', $storeId)->count();
        }

        return response()->json([
            'status' => 'success',
            'data' => $manifest,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get sync delta - changes since last sync
     */
    public function getSyncDelta(Request $request)
    {
        $entityType = $request->query('entity_type');
        $lastSync = $request->query('last_sync');
        $storeId = $request->query('store_id');

        if (!$entityType || !$lastSync) {
            return response()->json([
                'status' => 'error',
                'message' => 'entity_type and last_sync are required',
            ], 400);
        }

        $lastSyncTime = Carbon::parse($lastSync);
        $delta = [];

        switch ($entityType) {
            case 'products':
                $delta = Product::where('updated_at', '>=', $lastSyncTime)
                    ->where('is_active', true)
                    ->get();
                break;

            case 'contacts':
                $delta = Contact::where('updated_at', '>=', $lastSyncTime)->get();
                break;

            case 'charges':
                $delta = Charge::where('updated_at', '>=', $lastSyncTime)
                    ->where('is_active', true)
                    ->get();
                break;

            case 'sales':
                if ($storeId) {
                    $delta = Sale::where('store_id', $storeId)
                        ->where('updated_at', '>=', $lastSyncTime)
                        ->get();
                }
                break;
        }

        return response()->json([
            'status' => 'success',
            'entity_type' => $entityType,
            'data' => $delta,
            'count' => count($delta),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Helper: Format product with batches and stock
     */
    private function formatProduct($product, $storeId = null)
    {
        $imageUrl = '/storage/';
        if (app()->environment('production')) {
            $imageUrl = 'public/storage/';
        }

        $batches = $product->batches->map(function ($batch) use ($storeId) {
            $stockItem = $batch->stocks->first();

            if ($storeId) {
                $stockItem = $batch->stocks->firstWhere('store_id', $storeId);
            }

            return [
                'id' => $batch->id,
                'batch_number' => $batch->batch_number,
                'cost' => (float) $batch->cost,
                'price' => (float) $batch->price,
                'stock_quantity' => $stockItem ? (int) $stockItem->quantity : 0,
                'created_at' => $this->formatTimestamp($batch->created_at),
                'updated_at' => $this->formatTimestamp($batch->updated_at),
            ];
        });

        return [
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
            'sku' => $product->sku,
            'barcode' => $product->barcode,
            'image_url' => $imageUrl . $product->image_url,
            'unit' => $product->unit,
            'is_stock_managed' => (bool) $product->is_stock_managed,
            'is_active' => (bool) $product->is_active,
            'category_id' => $product->category_id,
            'product_type' => $product->product_type,
            'batches' => $batches,
            'created_at' => $this->formatTimestamp($product->created_at),
            'updated_at' => $this->formatTimestamp($product->updated_at),
        ];
    }

    /**
     * Helper: Format timestamp safely
     */
    private function formatTimestamp($timestamp)
    {
        if (!$timestamp) {
            return null;
        }

        if (is_string($timestamp)) {
            return $timestamp;
        }

        return $timestamp->toIso8601String();
    }

    /**
     * Helper: Create or update sale
     */
    private function createOrUpdateSale($saleData, $storeId)
    {
        $sale = Sale::updateOrCreate(
            ['id' => $saleData['id'] ?? null],
            [
                'store_id' => $storeId,
                'contact_id' => $saleData['contact_id'] ?? null,
                'sale_type' => $saleData['sale_type'] ?? 'normal',
                'total_amount' => $saleData['total_amount'],
                'discount' => $saleData['discount'] ?? 0,
                'amount_received' => $saleData['amount_received'],
                'profit_amount' => $saleData['profit_amount'] ?? 0,
                'status' => $saleData['status'] ?? 'completed',
                'payment_status' => $saleData['payment_status'] ?? 'completed',
                'note' => $saleData['note'] ?? null,
                'sale_date' => $saleData['sale_date'] ?? now(),
                'total_charge_amount' => $saleData['total_charge_amount'] ?? 0,
            ]
        );

        // Sync sale items if provided
        if (isset($saleData['items'])) {
            foreach ($saleData['items'] as $itemData) {
                SaleItem::updateOrCreate(
                    [
                        'sale_id' => $sale->id,
                        'product_id' => $itemData['product_id'] ?? null,
                    ],
                    [
                        'batch_id' => $itemData['batch_id'] ?? null,
                        'quantity' => $itemData['quantity'],
                        'unit_price' => $itemData['unit_price'],
                        'item_type' => $itemData['item_type'] ?? null,
                        'charge_id' => $itemData['charge_id'] ?? null,
                        'charge_type' => $itemData['charge_type'] ?? null,
                        'rate_value' => $itemData['rate_value'] ?? null,
                        'rate_type' => $itemData['rate_type'] ?? null,
                        'base_amount' => $itemData['base_amount'] ?? null,
                        'notes' => $itemData['notes'] ?? null,
                    ]
                );
            }
        }

        return $sale;
    }

    /**
     * Helper: Create or update transaction
     */
    private function createOrUpdateTransaction($txnData, $storeId)
    {
        return Transaction::updateOrCreate(
            ['id' => $txnData['id'] ?? null],
            [
                'store_id' => $storeId,
                'sale_id' => $txnData['sale_id'] ?? null,
                'contact_id' => $txnData['contact_id'] ?? null,
                'amount' => $txnData['amount'],
                'payment_method' => $txnData['payment_method'],
                'transaction_type' => $txnData['transaction_type'] ?? 'payment',
                'reference_number' => $txnData['reference_number'] ?? null,
                'notes' => $txnData['notes'] ?? null,
                'transaction_date' => $txnData['transaction_date'] ?? now(),
            ]
        );
    }
}
