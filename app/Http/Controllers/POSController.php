<?php

namespace App\Http\Controllers;

use App\Models\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Transaction;
use App\Models\Contact;
use App\Models\ProductStock;
use App\Models\Product;
use App\Models\Store;
use App\Models\ReloadAndBillMeta;
use App\Models\Setting;
use App\Models\TaxAndFee;
use App\Notifications\SaleCreated;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Auth;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

class POSController extends Controller
{
    public function getProducts($filters=[])
    {
        $imageUrl = 'storage/';
        if (app()->environment('production')) $imageUrl = 'public/storage/';

        $query = Product::query();
        $query->select(
            'products.id',
            DB::raw("CONCAT('{$imageUrl}', products.image_url) AS image_url"),
            'products.name',
            'products.discount',
            'products.is_stock_managed',
            DB::raw("COALESCE(pb.batch_number, 'N/A') AS batch_number"),
            DB::raw("COALESCE(product_stocks.quantity, 0) AS quantity"),
            DB::raw("COALESCE(product_stocks.quantity, 0) AS stock_quantity"),
            'pb.cost',
            'pb.price',
            'pb.id AS batch_id',
            'products.meta_data',
            'products.product_type',
            'products.alert_quantity'
        )
            ->leftJoin('product_batches AS pb', 'products.id', '=', 'pb.product_id') // Join with product_batches using product_id
            ->leftJoin('product_stocks', 'pb.id', '=', 'product_stocks.batch_id') // Join with product_stocks using batch_id
            ->where('product_stocks.store_id', session('store_id', Auth::user()->store_id))
            ->where('pb.is_active', 1);

        // Apply category filter if set
        if (isset($filters['category_id'])) {
            $query->where('products.category_id', $filters['category_id']);
        } else {
            $query->where('pb.is_featured', 1);
        }

        $products = $query->groupBy(
            'products.id',
            'products.image_url',
            'products.name',
            'products.discount',
            'products.is_stock_managed',
            DB::raw("COALESCE(pb.batch_number, 'N/A')"),
            'pb.cost',
            'pb.price',
            'pb.id',
            'product_stocks.quantity',
            'products.product_type',
            'products.meta_data',
            'products.alert_quantity'
        )
            ->limit(20)
            ->get();

        return $products;
    }

    public function getProductsByFilter(Request $request)
    {
        $categoryId = $request->input('category_id');
        $filters = [];

        if ($categoryId != 0) {
            $filters['category_id'] = $categoryId;
        }
        $products = $this->getProducts($filters);

        return response()->json($products);
    }

    public function index()
    {
        $contacts = Contact::select('id', 'name', 'balance')->customers()->get();
        $currentStore = Store::find(session('store_id', Auth::user()->store_id));
        $taxAndFees = TaxAndFee::all();

        if (!$currentStore) {
            return redirect()->route('store'); // Adjust the route name as necessary
        }
        $categories = Collection::where('collection_type', 'category')->get();
        $products = $this->getProducts();
        $miscSettings = Setting::where('meta_key', 'misc_settings')->first();
        $miscSettings = json_decode($miscSettings->meta_value, true);
        $cart_first_focus = $miscSettings['cart_first_focus'] ?? 'quantity';
        return Inertia::render('POS/POS', [
            'products' => $products,
            'urlImage' => url('storage/'),
            'customers' => $contacts,
            'currentStore' => $currentStore->name,
            'return_sale' => false,
            'sale_id' => null,
            'categories' => $categories,
            'cart_first_focus' => $cart_first_focus,
            'taxAndFees' => $taxAndFees
        ]);
    }

    public function returnIndex(Request $request, $sale_id)
    {
        $imageUrl = 'storage/';
        if (app()->environment('production')) $imageUrl = 'public/storage/';

        $sale = Sale::find($sale_id);
        $contacts = Contact::select('id', 'name', 'balance')->where('id', $sale->contact_id)->get();
        $currentStore = Store::find($sale->store_id);

        $miscSettings = Setting::where('meta_key', 'misc_settings')->first();
        $miscSettings = json_decode($miscSettings->meta_value, true);
        $cart_first_focus = $miscSettings['cart_first_focus'] ?? 'quantity';

        if (!$currentStore) {
            return redirect()->route('store'); // Adjust the route name as necessary
        }

        $products = Product::select(
            'products.id',
            DB::raw("CONCAT('{$imageUrl}', products.image_url) AS image_url"),
            'products.name',
            'si.discount',
            'products.is_stock_managed',
            DB::raw("COALESCE(pb.batch_number, 'N/A') AS batch_number"),
            'si.unit_cost as cost',
            'si.unit_price as price',
            'si.quantity',
            'products.meta_data',
            'products.product_type',
            'si.batch_id'
        )
            ->join('sale_items AS si', function ($join) use ($sale_id) {
                $join->on('products.id', '=', 'si.product_id')
                    ->where('si.sale_id', '=', $sale_id); // Ensure product is associated with the given sale_id
            })
            ->leftJoin('product_batches AS pb', 'products.id', '=', 'pb.product_id') // Join with product_batches using product_id
            ->leftJoin('product_stocks AS ps', 'pb.id', '=', 'si.batch_id') // Join with product_stocks using batch_id

            ->groupBy(
                'products.id',
                'products.image_url',
                'products.name',
                'si.discount',
                'products.is_stock_managed',
                DB::raw("COALESCE(pb.batch_number, 'N/A')"),
                'si.unit_cost',
                'si.unit_price',
                'si.batch_id',
                'si.quantity',
                'products.product_type',
                'products.meta_data'
            )
            ->get();

        return Inertia::render('POS/POS', [
            'products' => $products,
            'urlImage' => url('storage/'),
            'customers' => $contacts,
            'return_sale' => true,
            'sale_id' => $sale_id,
            'cart_first_focus' => $cart_first_focus
        ]);
    }

    public function checkout(Request $request)
    {
        $amountReceived = $request->input('amount_received', 0);
        $discount = $request->input('discount');
        $total = $request->input('net_total');
        $note = $request->input('note');
        $profitAmount = $request->input('profit_amount', 0); // Default to 0 if not provided
        $cartItems = $request->input('cartItems');
        $paymentMethod = $request->input('payment_method', 'none');
        $customerID = $request->input('contact_id');
        $saleDate = $request->input('sale_date', Carbon::now()->toDateString());
        $payments = $request->payments;
        $createdBy = Auth::id();
        $reference_id = $request->input('return_sale_id');
        $sale_type = $request->input('return_sale') ? 'return' : 'sale';

        DB::beginTransaction();
        try {
            $sale = Sale::create([
                'store_id' => session('store_id', Auth::user()->store_id), // Assign appropriate store ID
                'reference_id' => $reference_id,
                'sale_type' => $sale_type,
                'contact_id' => $customerID, // Assign appropriate customer ID
                'sale_date' => $saleDate, // Current date and time
                'total_amount' => $total, //Net total (total after discount)
                'discount' => $discount,
                'amount_received' => $amountReceived,
                'profit_amount' => $profitAmount,
                'status' => 'pending', // Or 'pending', or other status as needed
                'payment_status' => 'pending',
                'note' => $note,
                'created_by' => $createdBy,
            ]);

            if ($paymentMethod == 'Cash') {
                Transaction::create([
                    'sales_id' => $sale->id,
                    'store_id' => $sale->store_id,
                    'contact_id' => $sale->contact_id,
                    'transaction_date' => $sale->sale_date, // Current date and time
                    'amount' => $total,
                    'payment_method' => $paymentMethod,
                    'transaction_type' => 'sale'
                ]);
                $sale->status = 'completed';
                $sale->payment_status = 'completed';
                $sale->save();
            } else {
                foreach ($payments as $payment) {

                    $transactionData = [
                        'sales_id' => $sale->id,
                        'store_id' => $sale->store_id,
                        'contact_id' => $sale->contact_id,
                        'transaction_date' => $sale->sale_date,
                        'amount' => $payment['amount'],
                        'payment_method' => $payment['payment_method'],
                    ];

                    // Check if the payment method is not 'Credit'
                    if ($payment['payment_method'] != 'Credit') {
                        // Determine transaction type based on the payment method
                        if ($payment['payment_method'] == 'Account') {
                            // Set transaction type to 'account' for account payments
                            $transactionData['transaction_type'] = 'account';
                            Contact::where('id', $sale->contact_id)->decrement('balance', $payment['amount']);
                        } else {
                            $transactionData['transaction_type'] = 'sale';
                        }

                        // Update the total amount received
                        $amountReceived += $payment['amount'];

                        // Create the transaction
                        Transaction::create($transactionData);
                    } else if ($payment['payment_method'] == 'Credit') {
                        $transactionData['transaction_type'] = 'sale';
                        Transaction::create($transactionData);
                        Contact::where('id', $sale->contact_id)->decrement('balance', $payment['amount']);
                    }
                }

                if ($amountReceived >= $total) {
                    $sale->payment_status = 'completed';
                    $sale->status = 'completed';
                }

                $sale->amount_received = $amountReceived;
                $sale->save();
            }

            foreach ($cartItems as $item) {
                $sale_item = SaleItem::create([
                    'sale_id' => $sale->id, // Associate the sales item with the newly created sale
                    'product_id' => $item['id'], // Product ID (assuming you have this)
                    'batch_id' => $item['batch_id'], // Batch ID from the cart item
                    'quantity' => $item['quantity'], // Quantity sold
                    'unit_price' => $item['price'], // Sale price per unit
                    'unit_cost' => $item['cost'], // Cost price per unit
                    'discount' => $item['discount'], // Discount applied to this item
                    'sale_date' => $sale->sale_date,
                    'description' => isset($item['category_name']) ? $item['category_name'] : null,
                ]);

                if ($item['is_stock_managed'] == 1) {
                    $productStock = ProductStock::where('store_id', $sale->store_id)
                        ->where('batch_id', $item['batch_id'])
                        ->first();

                    // Check if stock exists
                    if ($productStock) {
                        // Deduct the quantity from the stock
                        $productStock->quantity -= $item['quantity'];

                        // Ensure that stock doesn't go negative
                        if ($productStock->quantity < 0) {
                            $productStock->quantity = 0;
                        }

                        $productStock->save();
                    } else {
                        DB::rollBack();
                        return response()->json(['error' => 'Stock for product not found in the specified store or batch'], 500);
                    }
                }

                if ($item['product_type'] == 'reload') {
                    $validator = Validator::make($item, [
                        'account_number' => 'required', // Account number must be required when product type is reload
                    ]);

                    if ($validator->fails()) {
                        // If validation fails, return an error response
                        return response()->json([
                            'error' => 'Account number is required for reload product type.',
                            'messages' => $validator->errors(),
                        ], 400);
                    }

                    // Create a ReloadAndBillMeta record with description 'reload'
                    ReloadAndBillMeta::create([
                        'sale_item_id' => $sale_item->id,
                        'transaction_type' => 'reload',
                        'account_number' => $item['account_number'],
                        'commission' => $item['commission'],
                        'additional_commission' => $item['additional_commission'],
                        'description' => $item['product_type'],
                    ]);
                }
            }

            DB::commit();

            return response()->json(['message' => 'Sale recorded successfully!', 'sale_id' => $sale->id], 201);
        } catch (\Exception $e) {
            // Rollback transaction in case of error
            DB::rollBack();

            Log::error('Transaction failed', [
                'error_message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Return error response
            return response()->json(['error' => $e], 500);
        }
    }

    public function customerDisplay()
    {
        return Inertia::render('POS/CustomerDisplay', []);
    }
}
