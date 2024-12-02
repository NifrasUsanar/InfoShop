<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Collection;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductStock;
use App\Models\Store;
use App\Models\Setting;

use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function getProducts($filters)
    {
        $imageUrl = 'storage/';
        if (app()->environment('production')) $imageUrl = 'public/storage/';

        $query = ProductBatch::query();
        $query->select(
            'products.id',
            'product_stocks.id as stock_id',
            'product_batches.is_featured',
            'product_batches.id AS batch_id',
            DB::raw("CONCAT('{$imageUrl}', products.image_url) AS image_url"),
            'products.name',
            'products.barcode',
            DB::raw("COALESCE(products.sku, 'N/A') AS sku"),
            DB::raw("COALESCE(product_batches.batch_number, 'N/A') AS batch_number"),
            DB::raw("COALESCE(product_batches.expiry_date, 'N/A') AS expiry_date"),
            'product_batches.cost',
            'product_batches.price',
            'product_batches.is_active',
            DB::raw("COALESCE(product_stocks.quantity, '0') AS quantity"),
            'product_stocks.store_id',
            'products.alert_quantity',
        )
            ->leftJoin('products', 'products.id', '=', 'product_batches.product_id') // Join with product_batches using product_id
            ->leftJoin('product_stocks', 'product_batches.id', '=', 'product_stocks.batch_id'); // Join with product_stocks using batch_id

        // Apply dynamic alert_quantity filter
        if (!empty($filters['alert_quantity'])) {
            if ($filters['alert_quantity'] === 'alert') {
                // Compare product_stocks.quantity with products.alert_quantity
                $query->whereColumn('product_stocks.quantity', '<=', 'products.alert_quantity');
            } else {
                // Use the provided alert_quantity value
                $query->where('product_stocks.quantity', '<=', $filters['alert_quantity']);
            }
        }

        // Apply filters based on the status
        if (isset($filters['status']) && $filters['status'] == 1) {
            // If status is 1, filter by store_id and status
            $query->where('product_batches.is_active', 1); // Assuming 1 means active
            if ($filters['store'] != 0) {
                $query->where('product_stocks.store_id', $filters['store']);
            }
        } else if (isset($filters['status'])) {
            // If status is not 1, only filter by status
            $query->where('product_batches.is_active', $filters['status']);
        } else $query->where('product_batches.is_active', 1);

        // Apply search query if provided
        if (!empty($filters['search_query'])) {
            $query->where(function ($query) use ($filters) {
                $query->where('products.barcode', 'LIKE', '%' . $filters['search_query'] . '%')
                    ->orWhere('products.name', 'LIKE', '%' . $filters['search_query'] . '%');
            });
        }

        $perPage = $filters['per_page'] ?? 100; // Default to 25 items per page
        $query->orderBy('products.id', 'desc');
        $results = $query->paginate($perPage);
        $results->appends($filters);
        return $results;
    }

    public function index(Request $request)
    {
        $filters = $request->only(['store', 'search_query', 'status', 'alert_quantity','per_page']);

        $products = $this->getProducts($filters);
        $stores = Store::select('id', 'name')->get();

        // Render the 'Products' component with data
        return Inertia::render('Product/Product', [
            'products' => $products,
            'stores' => $stores,
            'pageLabel' => 'Products',
            'remember' => true,
        ]);
    }

    public function create()
    {
        $incrementValue = Setting::where('meta_key', 'product_code_increment')->value('meta_value');
        $incrementValue = $incrementValue ?: 1000;

        $lastProduct = Product::latest('id')->first();
        $nextItemCode = $lastProduct ? ((int)$lastProduct->id + (int)$incrementValue + 1) : 1001;

        $collection = Collection::select('id', 'name', 'collection_type')->get();

        // Render the 'Product/ProductForm' component for adding a new product
        return Inertia::render('Product/ProductForm', [
            'collection' => $collection, // Example if you have categories
            'product_code' => $nextItemCode,
            'pageLabel' => 'Product Details',
        ]);
    }

    public function find($id)
    {
        $imageUrl = 'storage/';
        if (app()->environment('production')) $imageUrl = 'public/storage/';

        $collection = Collection::select('id', 'name', 'collection_type')->get();
        $product = Product::findOrFail($id);

        $metaData = $product->meta_data;
        if ($product->product_type === 'reload' && isset($metaData['fixed_commission'])) {
            $product->fixed_commission = $metaData['fixed_commission'];
        }
        $product->meta_data = $metaData;

        if (!empty($product->image_url)) {
            // If the image URL exists and is not empty
            $product->image_url = asset($imageUrl . $product->image_url);
        }
        // Render the 'Product/ProductForm' component for adding a new product
        return Inertia::render('Product/ProductForm', [
            'collection' => $collection, // Example if you have categories
            'product' => $product,
            'pageLabel' => 'Product Details',
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sku' => 'nullable|string|unique:products',
            'barcode' => 'nullable|string|unique:products',
            'featured_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:10000', // Image validation
            'unit' => 'nullable|string|max:100',
            'quantity' => 'required|numeric|min:0',
            'alert_quantity' => 'nullable|numeric|min:0',
            'cost' => 'required|numeric|min:0', // Cost price validation
            'price' => 'required|numeric|min:0', // Sale price validation
            'is_stock_managed' => 'boolean',
            'is_active' => 'boolean',
            'brand_id' => 'nullable|exists:collections,id', // Assuming brands table exists
            'category_id' => 'nullable|exists:collections,id', // Assuming categories table exists
        ]);

        $imageUrl = null;
        if ($request->hasFile('featured_image')) {
            $folderPath = 'uploads/' . date('Y') . '/' . date('m');
            $imageUrl = $request->file('featured_image')->store($folderPath, 'public'); // Store the image in the public disk
        }

        // Prepare meta_data (convert to JSON)
        $metaData = $request->meta_data ?? []; // If no meta_data is provided, default to an empty array

        // Check if the product type is 'reload' and add specific fields (e.g., fixed_commission) to meta_data
        if ($request->product_type === 'reload') {
            $metaData['fixed_commission'] = $request->fixed_commission ?? 0; // Optional fixed_commission field
        }

        $product = Product::create([
            'name' => $request->name,
            'description' => $request->description,
            'sku' => $request->sku,
            'barcode' => $request->barcode,
            'image_url' => $imageUrl, // Save the image path
            'unit' => $request->unit,
            'quantity' => $request->quantity,
            'alert_quantity' => $request->alert_quantity ?? 5,
            'is_stock_managed' => $request->is_stock_managed,
            'is_active' => 1,
            'brand_id' => $request->brand_id,
            'category_id' => $request->category_id,
            'product_type' => $request->product_type,
            'meta_data' => $metaData,
        ]);

        $productBatch = ProductBatch::create([
            'product_id' => $product->id,
            'batch_number' => $request->batch_number ?: 'DEFAULT',
            'expiry_date' => $request->expiry_date,
            'cost' => $request->cost,
            'price' => $request->price,
        ]);

        ProductStock::create([
            'store_id' => 1,
            'batch_id' => $productBatch->id, // Use the batch ID from the created ProductBatch
            'quantity' => $request->quantity,
        ]);

        return redirect()->route('products.index')->with('success', 'Product created successfully!');
    }

    public function update(Request $request, $id)
    {
        // Validate the incoming request
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sku' => 'nullable|string|unique:products,sku,' . $id, // Ensure SKU is unique except for the current product
            'barcode' => 'nullable|string|unique:products,barcode,' . $id,
            'featured_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:10000', // Image validation
            'unit' => 'nullable|string|max:100',
            'alert_quantity' => 'nullable|numeric|min:0',
            'is_stock_managed' => 'boolean',
            'is_active' => 'boolean',
            'brand_id' => 'nullable|exists:collections,id',
            'category_id' => 'nullable|exists:collections,id',
        ]);

        DB::beginTransaction();

        try {
            // Find the product by ID, or fail if it doesn't exist
            $product = Product::findOrFail($id);

            // Handle the image upload
            $imageUrl = $product->image_url; // Retain the current image URL
            if ($request->hasFile('featured_image')) {
                $folderPath = 'uploads/' . date('Y') . '/' . date('m') . '/';
                $imageUrl = $request->file('featured_image')->store($folderPath, 'public'); // Store new image and replace the old one
            }

            $metaData = $product->meta_data ?? [];
            if ($request->product_type == 'reload' && $request->has('fixed_commission')) {
                // Merge existing meta_data with the fixed_commission field
                $metaData['fixed_commission'] = $request->fixed_commission;
            }

            // Update the product with new values
            $product->update([
                'name' => $request->name,
                'description' => $request->description,
                'sku' => $request->sku,
                'barcode' => $request->barcode,
                'image_url' => $imageUrl, // Update the image URL if a new image was uploaded
                'unit' => $request->unit,
                'alert_quantity' => $request->alert_quantity ?? 5, // Use default alert_quantity if null
                'is_stock_managed' => $request->is_stock_managed,
                'is_active' => $request->is_active ?? 1, // Default to active if not provided
                'brand_id' => $request->brand_id,
                'category_id' => $request->category_id,
                'product_type' => $request->product_type,
                'meta_data' => $metaData,
            ]);

            DB::commit();

            // Return a response, or redirect to a specific page
            return redirect()->route('products.index')->with('success', 'Product updated successfully!');
        } catch (\Exception $e) {
            // Rollback the transaction if something failed
            DB::rollBack();

            // Return an error response
            return redirect()->back()->withErrors(['error' => 'Failed to update product: ' . $e->getMessage()]);
        }
    }

    public function searchProduct(Request $request)
    {
        $imageUrl = 'storage/';
        if (app()->environment('production')) $imageUrl = 'public/storage/';

        $search_query = $request->input('search_query');
        $is_purchase = $request->input('is_purchase', 0);

        $products = Product::select(
            'products.id',
            DB::raw("CONCAT('{$imageUrl}', products.image_url) AS image_url"),
            'products.name',
            'products.barcode',
            // DB::raw("COALESCE(products.sku, 'N/A') AS sku"), //if we comment it, it will not generate on front end
            'products.discount',
            'products.is_stock_managed',
            DB::raw("COALESCE(product_batches.batch_number, 'N/A') AS batch_number"),
            'product_batches.cost',
            'product_batches.price',
            'product_batches.id AS batch_id',
            DB::raw("COALESCE(product_stocks.quantity, 0) AS quantity"),
            DB::raw("COALESCE(product_stocks.quantity, 0) AS stock_quantity"),
            'products.meta_data',
            'products.product_type'
        )
            ->leftJoin('product_batches', 'products.id', '=', 'product_batches.product_id') // Join with product_batches using product_id
            ->leftJoin('product_stocks', 'product_batches.id', '=', 'product_stocks.batch_id') // Join with product_stocks using batch_id
            ->leftJoin('collections', 'products.category_id', '=', 'collections.id')
            ->where('product_batches.is_active', 1)
            ->where('barcode', 'like', $search_query . '%')
            ->orWhere('sku', 'like', '%' . $search_query . '%')
            ->orWhere('products.name', 'like', '%' . $search_query . '%');

        // it means, If it is a sale
        if ($is_purchase == 0) {
            $products = $products->where('product_stocks.store_id', session('store_id'));
        } else {
            // $products = $products->whereNotNull('product_stocks.store_id');
            $products = $products->where('products.product_type', '!=', 'reload');
        }

        $products = $products
            ->groupBy(
                'products.id',
                'product_batches.id',
                'product_batches.batch_number',
                'product_stocks.quantity',
                'products.image_url',
                'products.name',
                'products.discount',
                'products.is_stock_managed',
                'product_batches.cost',
                'product_batches.price',
                'products.barcode',
                'products.sku',
                'products.meta_data',
                'products.product_type'
            )
            ->limit(10)->get();

        return response()->json([
            'products' => $products,
        ]);
    }

    public function storeNewBatch(Request $request)
    {
        // Validate the incoming request data
        $validatedData = $request->validate(
            [
                'id' => 'required|exists:products,id', // Ensure product_id exists in products table
                'new_batch' => [
                    'required',
                    'string',
                    'max:255',
                    'unique:product_batches,batch_number,NULL,id,product_id,' . $request->id,
                ],
                'cost' => 'required|numeric|min:0',
                'price' => 'required|numeric|min:0',
            ],
            [
                // Custom error message for unique validation
                'new_batch.unique' => 'The batch number is already in use for this product.',
            ]
        );

        $batch = ProductBatch::create([
            'product_id' => $validatedData['id'], // Map 'id' to 'product_id'
            'batch_number' => $validatedData['new_batch'], // Map 'new_batch' to 'batch_number'
            'cost' => $validatedData['cost'],
            'price' => $validatedData['price'],
        ]);

        return response()->json([
            'message' => 'Batch is created',
            'batch_id' => $batch->id,
        ]);
    }

    public function checkBatch(Request $request)
    {
        $cost = $request->input('cost');
        $batchNumber = $request->input('batch_number');
        $product_id = $request->input('id');

        // Check if the batch exists with the exact product, cost, and batch_number
        $batch = ProductBatch::where('product_id', $product_id)
            ->where('batch_number', $batchNumber)
            ->first();

        $product = Product::find($product_id);

        $status = 'new'; // Default to 'new' batch
        $message = 'New batch created'; // Default message
        $batchResponse = null;

        if ($batch && $product->product_type == 'simple') {
            if ($batch->cost == $cost) {
                // Same cost and batch, set to existing
                $status = 'existing';
                $message = 'Batch found';
                $batchResponse = $batch; // Return existing batch details
            } else {
                // Different cost but same batch number, treat as new
                $status = 'invalid';
                $message = 'Batch with different cost, please create a new batch';
                $batchResponse = null; // No batch, create a new one
            }
        }

        return response()->json([
            'message' => $message,
            'status' =>  $status,
            'batch' => $batchResponse,
        ]);
    }

    public function updateBatch(Request $request, $id)
    {
        $batch = ProductBatch::findOrFail($id);

        $validatedData = $request->validate([
            'batch_number' => [
                'required',
                'string',
                'max:255',
                'unique:product_batches,batch_number,' . $id . ',id,product_id,' . $batch->product_id,
            ],
            'cost' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
        ]);

        $batch->update([
            'batch_number' => $validatedData['batch_number'], // Map 'new_batch' to 'batch_number'
            'cost' => $validatedData['cost'],
            'price' => $validatedData['price'],
            'expiry_date' => $request->expiry_date,
            'is_active' => $request->is_active ?? 0,
            'is_featured' => $request->is_featured ?? 0,
        ]);

        return response()->json([
            'message' => 'Batch updated successfully!',
            'batch' => $batch,
        ], 200);
    }

    public function getProductsResponse($store_id)
    {
        $products = $this->getProducts($store_id);
        return response()->json([
            'products' => $products,
        ], 200);
    }

    public function getBarcode($batch_id)
    {
        $product = ProductBatch::select('products.name', 'products.barcode', 'product_batches.price')
            ->join('products', 'product_batches.product_id', '=', 'products.id')
            ->where('product_batches.id', $batch_id)
            ->first();

        $settings = Setting::whereIn('meta_key', [
            'show_barcode_store',
            'show_barcode_product_price',
            'show_barcode_product_name',
            'barcode_settings',
        ])->get();
        $settingArray = $settings->pluck('meta_value', 'meta_key')->all();
        // Render the 'Products' component with data
        return Inertia::render('Product/Barcode', [
            'product' => $product,
            'barcode_settings' => $settingArray,
        ]);
    }
}
