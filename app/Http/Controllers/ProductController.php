<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Collection;
use App\Models\Contact;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductStock;
use App\Models\Store;
use App\Models\Setting;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use App\Models\Attachment;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

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
            'product_batches.contact_id',
            'contacts.name as contact_name',
        )
            ->leftJoin('products', 'products.id', '=', 'product_batches.product_id') // Join with product_batches using product_id
            ->leftJoin('product_stocks', 'product_batches.id', '=', 'product_stocks.batch_id') // Join with product_stocks using batch_id
            ->leftJoin('contacts', 'product_batches.contact_id', '=', 'contacts.id'); // Join with product_stocks using batch_id

        // Apply dynamic alert_quantity filter
        if (!empty($filters['alert_quantity'])) {
            $query->where('product_stocks.quantity', '<=', $filters['alert_quantity']);
        }

        if (isset($filters['store']) && !empty($filters['store'] != 0)) {
            $query->where('product_stocks.store_id', $filters['store']);
        }

        if (isset($filters['contact_id'])) {
            $query->where('product_batches.contact_id', $filters['contact_id']);
        }

        // Apply filters based on the status
        if (isset($filters['status']) && $filters['status'] == 0) {
            $query->where('product_batches.is_active', 0);
        } else if (isset($filters['status']) && $filters['status'] == 'alert') {
            $query->whereColumn('product_stocks.quantity', '<=', 'products.alert_quantity');
            $query->where('product_batches.is_active', 1);
        } else if (isset($filters['status']) && $filters['status'] == 'out_of_stock') {
            $query->where('product_stocks.quantity', '<=', 0);
            $query->where('products.is_stock_managed', 1);
            $query->where('product_batches.is_active', 1);
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
        $filters = $request->only(['store', 'search_query', 'status', 'alert_quantity', 'per_page', 'contact_id']);

        $products = $this->getProducts($filters);

        // return response()->json($products);
        $stores = Store::select('id', 'name')->get();
        $contacts = Contact::select('id', 'name', 'balance')->vendors()->get();
        // Render the 'Products' component with data
        return Inertia::render('Product/Product', [
            'products' => $products,
            'stores' => $stores,
            'pageLabel' => 'Products',
            'remember' => true,
            'contacts' => $contacts,
        ]);
    }

    public function create()
    {
        $miscSettings = Setting::getMiscSettings();
        $incrementValue = Setting::where('meta_key', 'product_code_increment')->value('meta_value');
        $incrementValue = $incrementValue ? $incrementValue : 1000;

        $lastProduct = Product::latest('id')->first();
        do {
            $nextItemCode = $lastProduct ? ((int)$lastProduct->id + (int)$incrementValue + 1) : (int)$incrementValue + 1;
            $lastProduct = Product::where('barcode', $nextItemCode)->first();
            $incrementValue++; // Increment the value to ensure uniqueness
        } while ($lastProduct);

        $collection = Collection::select('id', 'name', 'collection_type')->get();
        $contacts = Contact::select('id', 'name')->vendors()->get();
        // Render the 'Product/ProductForm' component for adding a new product
        return Inertia::render('Product/ProductForm', [
            'collection' => $collection, // Example if you have categories
            'product_code' => $nextItemCode,
            'pageLabel' => 'Product Details',
            'contacts' => $contacts,
            'product_alert'=> $miscSettings['product_alert'] ?? 3,
            'misc_setting'=> $miscSettings,
        ]);
    }

    public function find($id)
    {
        $imageUrl = 'storage/';
        if (app()->environment('production')) $imageUrl = 'public/storage/';

        $miscSettings = Setting::getMiscSettings();
        $collection = Collection::select('id', 'name', 'collection_type')->get();
        $product = Product::findOrFail($id);

        $metaData = $product->meta_data;
        if (in_array($product->product_type, ['reload', 'commission']) && isset($metaData['fixed_commission'])) {
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
            'misc_setting'=> $miscSettings,
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
            'expiry_date' => [
                'nullable',
                'date_format:m/d/y',
//                'after_or_equal:today', // Ensures the expiry date is today or a future date
            ],
        ]);

        $imageUrl = null;
        $attachment = null;
        if ($request->hasFile('featured_image')) {
            $folderPath = 'uploads/' . date('Y') . '/' . date('m');
            $imageUrl = $request->file('featured_image')->store($folderPath, 'public'); // Store the image in the public disk

            // Create an attachment using the Attachment model
            $attachment = Attachment::create([
                'path' => $imageUrl, // Path where the image is stored
                'file_name' => $request->name,
                'size' => $request->file('featured_image')->getSize(), // File size in bytes
                'attachment_type' => 'image', // Type of attachment
                'alt_text' => $request->name, // Optional alt text
                'title' => $request->name, // Optional title
                'description' => $request->description ?? null, // Optional description
            ]);
        }

        // Prepare meta_data (convert to JSON)
        $metaData = $request->meta_data ?? []; // If no meta_data is provided, default to an empty array

        // Check if the product type is 'reload' and add specific fields (e.g., fixed_commission) to meta_data
        if (in_array($request->product_type, ['reload', 'commission'])) {
            $metaData['fixed_commission'] = $request->fixed_commission ?? 0; // Optional fixed_commission field
        }

        $product = Product::create([
            'name' => $request->name,
            'description' => $request->description,
            'sku' => $request->sku,
            'barcode' => $request->barcode,
            'image_url' => $imageUrl, // Save the image path
            'attachment_id' => $attachment ? $attachment->id : null,
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
            'expiry_date' => $request->expiry_date ? Carbon::parse($request->expiry_date)->format('Y-m-d') : null,
            'cost' => $request->cost,
            'price' => $request->price,
            'contact_id' => $request->contact_id,
        ]);

        ProductStock::create([
            'store_id' => 1,
            'batch_id' => $productBatch->id, // Use the batch ID from the created ProductBatch
            'quantity' => $request->quantity,
            'product_id' => $product->id,
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
            $attachment = null;
            if ($request->hasFile('featured_image')) {
                $folderPath = 'uploads/' . date('Y') . '/' . date('m');
                $imageUrl = $request->file('featured_image')->store($folderPath, 'public'); // Store new image and replace the old one

                // Create an attachment using the Attachment model
                $attachment = Attachment::create([
                    'path' => $imageUrl, // Path where the image is stored
                    'file_name' => $request->name, // Original file name
                    'size' => $request->file('featured_image')->getSize(), // File size in bytes
                    'attachment_type' => 'image', // Type of attachment
                    'alt_text' => $request->name, // Optional alt text
                    'title' => $request->name, // Optional title
                    'description' => $request->description ?? null, // Optional description
                ]);

                // If the product already has an attachment_id, delete the old attachment
                if ($product->attachment_id) {
                    $oldAttachment = Attachment::find($product->attachment_id);
                    if ($oldAttachment) {
                        // Delete the file from storage
                        Storage::disk('public')->delete($oldAttachment->path);
                        // Delete the old attachment record
                        $oldAttachment->delete();
                    }
                }
            }

            $metaData = $product->meta_data ?? [];
            if (in_array($request->product_type, ['reload', 'commission']) && $request->has('fixed_commission')) {
                $metaData['fixed_commission'] = $request->fixed_commission;
            }

            // Update the product with new values
            $product->update([
                'name' => $request->name,
                'description' => $request->description,
                'sku' => $request->sku,
                'barcode' => $request->barcode,
                'image_url' => $imageUrl, // Update the image URL if a new image was uploaded
                'attachment_id' => $attachment ? $attachment->id : $product->attachment_id,
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
            'products.product_type',
            'products.alert_quantity',
        )
            ->leftJoin('product_batches', 'products.id', '=', 'product_batches.product_id') // Join with product_batches using product_id
            ->leftJoin('product_stocks', 'product_batches.id', '=', 'product_stocks.batch_id') // Join with product_stocks using batch_id
            ->leftJoin('collections', 'products.category_id', '=', 'collections.id')
            ->where('product_batches.is_active', 1)
            ->where(function ($query) use ($search_query) {
                $query->where('barcode', 'like', $search_query . '%')
                    ->orWhere('sku', 'like', '%' . $search_query . '%')
                    ->orWhere('products.name', 'like', '%' . $search_query . '%');
            });

        // it means, If it is a sale
        if ($is_purchase == 0) {
            $products = $products->where('product_stocks.store_id', session('store_id', Auth::user()->store_id));
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
                'products.product_type',
                'products.alert_quantity',
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
            'contact_id' => $request->contact_id,
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
            'expiry_date' => 'nullable|date',
        ]);

        $batch->update([
            'batch_number' => $validatedData['batch_number'], // Map 'new_batch' to 'batch_number'
            'cost' => $validatedData['cost'],
            'price' => $validatedData['price'],
            'expiry_date' => $request->expiry_date ? Carbon::parse($request->expiry_date)->format('Y-m-d') : null,
            'is_active' => $request->is_active ?? 0,
            'is_featured' => $request->is_featured ?? 0,
            'contact_id' => $request->contact_id,
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
        $imageUrl = '';
        if (app()->environment('production')) $imageUrl = 'public/';

        $product = ProductBatch::select('products.name', 'products.barcode', 'product_batches.price')
            ->join('products', 'product_batches.product_id', '=', 'products.id')
            ->where('product_batches.id', $batch_id)
            ->first();

        $settings = Setting::whereIn('meta_key', [
            'show_barcode_store',
            'show_barcode_product_price',
            'show_barcode_product_name',
            'barcode_settings',
            'shop_logo',
        ])->get();
        $settingArray = $settings->pluck('meta_value', 'meta_key')->all();
        $settingArray['shop_logo'] = $imageUrl . $settingArray['shop_logo'];

        $templateName = 'barcode-template.html'; // or get this from the request
        $templatePath = storage_path("app/public/templates/{$templateName}");
        $content = File::exists($templatePath) ? File::get($templatePath) : '';

        $template = Setting::where('meta_key', 'barcode-template')->first();

        // Render the 'Products' component with data
        return Inertia::render('Product/Barcode', [
            'product' => $product,
            'barcode_settings' => $settingArray,
            'template' => $content,
        ]);

        // return Inertia::render('Product/BarcodeView', [
        //     'product' => $product,
        //     'barcode_settings' => $settingArray,
        //     'template' => $template->meta_value,
        // ]);
    }
}
