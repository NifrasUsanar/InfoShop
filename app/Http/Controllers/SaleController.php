<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Setting;
use App\Models\Contact;
use App\Models\User;
use App\Models\ProductStock;
use App\Models\CashLog;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use App\Notifications\SaleCreated;
use App\Notifications\SaleDeleted;
use Carbon\Carbon;

class SaleController extends Controller
{
    public function getSales($filters)
    {

        $query = Sale::query();
        $query->select(
            'sales.id',
            'contact_id',            // Customer ID
            'sale_date',              // Sale date
            'total_amount',           // Total amount (Total amount after discount [net_total - discount])
            'discount',                // Discount
            'amount_received',         // Amount received
            'profit_amount',          // Profit amount
            'status',
            'payment_status',
            'contacts.name',
            'contacts.balance',
            'store_id',
            'invoice_number',
            'sale_type',
            'sales.created_at',
        )
            ->leftJoin('contacts', 'sales.contact_id', '=', 'contacts.id')
            ->orderBy('sales.id', 'desc');

        if (isset($filters['contact_id'])) {
            $query->where('contact_id', $filters['contact_id']);
        }

        if (isset($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        // if (!isset($filters['start_date']) || !isset($filters['end_date'])) {
        //     $today = now()->format('Y-m-d'); // Format current date to 'Y-m-d'
        //     // dd($today);
        //     $filters['start_date'] = $filters['start_date'] ?? $today;
        //     $filters['end_date'] = $filters['end_date'] ?? $today;
        // }

        if (($filters['status'] ?? null) !== 'pending' && isset($filters['start_date']) && isset($filters['end_date'])) {
            $query->whereBetween('sale_date', [$filters['start_date'], $filters['end_date']]);
        }

        if (isset($filters['query'])) {
            $query->where('invoice_number', 'LIKE', '%' . $filters['query'] . '%');
        }

        $perPage = $filters['per_page'] ?? 100;
        $results = $query->paginate($perPage);
        $results->appends($filters);
        return $results;
    }

    public function index(Request $request)
    {
        $filters = $request->only(['contact_id', 'start_date', 'end_date', 'status', 'query', 'per_page']);
        $sales = $this->getSales($filters);
        $contacts = Contact::select('id', 'name', 'balance')->customers()->get();

        return Inertia::render('Sale/Sale', [
            'sales' => $sales,
            'contacts' => $contacts,
            'pageLabel' => 'Sales',
        ]);
    }

    public function receipt($id)
    {
        $imageUrl = '';
        if (app()->environment('production')) $imageUrl = 'public/';

        $settings = Setting::all();
        $settingArray = $settings->pluck('meta_value', 'meta_key')->all();
        $settingArray['shop_logo'] = $imageUrl . $settingArray['shop_logo'];

        $sale = Sale::select(
            'sales.id',
            'contact_id',            // Customer ID
            'sale_date',              // Sale date
            'total_amount',           // Total amount (Total amount after discount [net_total - discount])
            'total_charge_amount',    // Total charge amount
            'discount',                // Discount
            'amount_received',         // Amount received
            'status',                  // Sale status
            'stores.address',
            'contacts.name', // Customer name from contacts
            'contacts.whatsapp',
            'sales.created_by',
            'invoice_number',
            'stores.sale_prefix',
            'stores.contact_number',
            'sales.created_at'
        )
            ->leftJoin('contacts', 'sales.contact_id', '=', 'contacts.id') // Join with contacts table using customer_id
            ->join('stores', 'sales.store_id', '=', 'stores.id')
            ->where('sales.id', $id)
            ->first();

        if (!$sale) {
            abort(404); // This will trigger the 404 error page
        }

        $user = User::find($sale->created_by);

        $salesItems = SaleItem::select(
            'sale_items.quantity',
            'sale_items.unit_price',
            'sale_items.discount',
            'sale_items.flat_discount',
            'sale_items.free_quantity',
            'sale_items.charge_id',
            'sale_items.item_type',
            'sale_items.description',
            'sale_items.charge_type',
            'sale_items.rate_value',
            'sale_items.rate_type',
            'products.name',
            DB::raw("CASE
                WHEN products.product_type = 'reload'
                THEN reload_and_bill_metas.account_number
                ELSE NULL
             END as account_number")
        )
            ->leftJoin('products', 'sale_items.product_id', '=', 'products.id') // Join with contacts table using customer_id
            ->leftJoin('reload_and_bill_metas', function ($join) {
                $join->on('sale_items.id', '=', 'reload_and_bill_metas.sale_item_id')
                    ->where('products.product_type', '=', 'reload');
            })
            ->where('sale_items.sale_id', $id)
            ->get();

        return Inertia::render('Sale/Receipt', [
            'sale' => $sale,
            'salesItems' => $salesItems,
            'settings' => $settingArray,
            'user_name' => $user->name,
        ]);
    }

    public function getSoldItems($filters)
    {
        $query = SaleItem::query();
        $query->select(
            'sale_items.id',
            'sale_items.sale_id',
            'sale_items.product_id',
            'sale_items.quantity',
            'sale_items.unit_price',
            'sale_items.unit_cost',
            'sale_items.discount',
            'sale_items.flat_discount',
            'products.name as product_name',
            'products.barcode',
            'sales.sale_date',
            'contacts.name as contact_name',
            'contacts.balance',

            DB::raw('((unit_price - sale_items.discount - unit_cost) * sale_items.quantity) as profit'),
        )
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('contacts', 'sales.contact_id', '=', 'contacts.id')
            ->orderBy('sales.id', 'desc');

        if (isset($filters['item_type'])) {
            if ($filters['item_type'] == 'free') {
                $query->whereRaw('(unit_price - sale_items.discount) = 0');
            }
            if ($filters['item_type'] == 'regular') {
                $query->whereRaw('(unit_price - sale_items.discount) > 0');
            }
            if ($filters['item_type'] == 'return') {
                $query->where('sale_items.quantity', '<', 0);
            }
        }

        if (isset($filters['contact_id'])) {
            $query->where('sales.contact_id', $filters['contact_id']);
        }

        if (isset($filters['start_date']) && isset($filters['end_date'])) {
            $query->whereBetween('sales.sale_date', [$filters['start_date'], $filters['end_date']]);
        }

        if (isset($filters['query'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('products.name', 'LIKE', '%' . $filters['query'] . '%')
                    ->orWhere('products.barcode', 'LIKE', '%' . $filters['query'] . '%');
            });
        }

        $perPage = $filters['per_page'] ?? 100;
        $results = $query->paginate($perPage);
        $results->appends($filters);
        return $results;
    }

    public function soldItemSummary(Request $request)
    {
        $filters = $request->only(['start_date', 'end_date']);

        if (empty($filters['start_date']) && empty($filters['end_date'])) {
            $filters['start_date'] = date('Y-m-d');
            $filters['end_date'] = date('Y-m-d');
        }

        $soldItems = SaleItem::select(
            'sale_items.product_id',
            'products.name',
            DB::raw('sum(sale_items.quantity) as total_quantity')
        )
        ->where('sale_items.item_type', 'product')
        ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
        ->join('products', 'sale_items.product_id', '=', 'products.id')
        ->groupBy('sale_items.product_id', 'products.name');

        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $soldItems = $soldItems->whereBetween('sales.sale_date', [$filters['start_date'], $filters['end_date']]);
        }
        $soldItems = $soldItems->get()->map(function ($item) {
            return [
                'product_id' => $item->product_id,
                'total_quantity' => $item->total_quantity,
                'product' => [
                    'name' => $item->name,
                ],
            ];
        });
        return Inertia::render('SoldItem/SoldItemSummary', [
            'sold_items' => $soldItems,
            'pageLabel' => 'Sold Items',
        ]);
    }

    public function solditems(Request $request)
    {
        $filters = $request->only(['contact_id', 'start_date', 'end_date', 'per_page', 'order_by', 'query', 'item_type', 'is_report']);
        $soldItems = $this->getSoldItems($filters);
        $contacts = Contact::select('id', 'name', 'balance')->customers()->get();
        return Inertia::render('SoldItem/SoldItem', [
            'sold_items' => $soldItems,
            'contacts' => $contacts,
            'pageLabel' => 'Sold Items',
        ]);
    }

    public function pendingSalesReceipt(Request $request, $contact_id)
    {
        $settings = Setting::all();
        $settingArray = $settings->pluck('meta_value', 'meta_key')->all();
        $sales = Sale::select(
            'sales.id',
            'sale_date',              // Sale date
            'total_amount',           // Total amount (Total amount after discount [net_total - discount])
            'discount',                // Discount
            'amount_received',         // Amount received
            'status',                  // Sale status
            'stores.address',
            'contacts.name',
            'contacts.whatsapp',
            'contacts.balance',
            'invoice_number',
            'stores.sale_prefix',
            'stores.contact_number',
            'sales.created_at'
        )
            ->where('sales.contact_id', $contact_id) // Filter by contact_id
            ->where('sales.status', 'pending')
            ->leftJoin('contacts', 'sales.contact_id', '=', 'contacts.id') // Join with contacts table using customer_id
            ->join('stores', 'sales.store_id', '=', 'stores.id')
            ->get(); // Fetch all matching sales

        $saleIds = $sales->pluck('id')->toArray();

        // Fetch return sale for the pending sales
        $completedSales = Sale::select(
            'sales.id',
            'sale_date',
            'total_amount',
            'discount',
            'amount_received',
            'status',
            'stores.address',
            'contacts.name',
            'contacts.whatsapp',
            'contacts.balance',
            'invoice_number',
            'stores.sale_prefix',
            'stores.contact_number',
            'sales.created_at'
        )
            ->where('sales.contact_id', $contact_id)
            ->whereIn('sales.reference_id', $saleIds)
            ->leftJoin('contacts', 'sales.contact_id', '=', 'contacts.id')
            ->join('stores', 'sales.store_id', '=', 'stores.id')
            ->get();

        $sales = $sales->merge($completedSales);

        if ($sales->isEmpty()) {
            return Inertia::render('Sale/Receipt', [
                'sale' => '',
                'salesItems' => '',
                'settings' => $settingArray,
                'credit_sale' => true,
            ]);
        }

        // Fetch all sale items related to the fetched sales
        // Build database-agnostic date format SQL
        $dateFormat = DB::getDriverName() === 'mysql'
            ? "CONCAT(' [', DATE_FORMAT(sale_items.sale_date, '%Y-%m-%d'), '] - ', products.name)"
            : "' [' || strftime('%Y-%m-%d', sale_items.sale_date) || '] - ' || products.name";

        $salesItems = SaleItem::select(
            'sale_items.quantity',
            'sale_items.unit_price',
            'sale_items.discount',
            'sale_items.flat_discount',
            'sale_items.free_quantity',
            'sale_items.charge_id',
            'sale_items.item_type',
            'sale_items.description',
            'sale_items.charge_type',
            'sale_items.rate_value',
            'sale_items.rate_type',
            DB::raw("$dateFormat as name"),
            'sale_items.sale_id', // Include sale_id for mapping
            DB::raw("CASE
                WHEN products.product_type = 'reload'
                THEN reload_and_bill_metas.account_number
                ELSE NULL
             END as account_number")
        )
            ->whereIn('sale_items.sale_id', $sales->pluck('id')) // Fetch only items for the selected sales
            ->leftJoin('products', 'sale_items.product_id', '=', 'products.id')
            ->leftJoin('reload_and_bill_metas', function ($join) {
                $join->on('sale_items.id', '=', 'reload_and_bill_metas.sale_item_id')
                    ->where('products.product_type', '=', 'reload');
            })
            ->get();

        $mergedSale = [
            'id' => 'merged', // Use a placeholder ID for the merged sale
            'sale_date' => now(), // Set the current date for the merged sale
            'total_amount' => $sales->sum('total_amount'), // Sum of total amounts
            'discount' => $sales->sum('discount'), // Sum of discounts
            'amount_received' => $sales->sum('amount_received'), // Sum of amounts received
            'address' => $sales->first()->address, // Use the first sale's address
            'name' => $sales->first()->name . ' | Balance: ' . $sales->first()->balance, // Use the first sale's customer name
            'created_by' => $sales->first()->created_by, // Use the first sale's creator
            'invoice_number' => 'Merged-' . uniqid(), // Generate a unique invoice number for the merged sale
            'sale_prefix' => '', // Use the first sale's prefix
            'contact_number' => $sales->first()->contact_number, // Use the first sale's contact number
            'created_at' => now(), // Set current timestamp for the merged sale
            'balance' => $sales->first()->balance,
            'whatsapp' => $sales->first()->whatsapp
        ];

        return Inertia::render('Sale/Receipt', [
            'sale' => $mergedSale,
            'salesItems' => $salesItems,
            'settings' => $settingArray,
            'credit_sale' => true,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        /** @var \App\Models\User */
        $user = Auth::user();
        if (!$user->hasRole('admin')) {
            return response()->json(['error' => 'You are not authorized to delete a sale'], 403);
        }
        $today = Carbon::today();
        $sale = Sale::find($id);
        if (!$sale) {
            return response()->json(['error' => 'Sale not found'], 404);
        }

        if (!$sale->created_at->isSameDay($today)) {
            return response()->json(['error' => 'Only sales created today can be deleted'], 403);
        }

        DB::beginTransaction();
        try {
            $sale = Sale::findOrFail($id);

            // Delete associated sale items
            foreach ($sale->saleItems as $item) {

                $product = Product::find($item->product_id);
                // If the item affects stock, adjust the stock back
                if ($product->is_stock_managed) {
                    $productStock = ProductStock::where('store_id', $sale->store_id)
                        ->where('batch_id', $item->batch_id)
                        ->first();
                    if ($productStock) {
                        $productStock->quantity += $item->quantity;
                        $productStock->save();
                    }
                }
                $item->delete(); // Delete the sale item
            }

            // Delete associated transactions
            foreach ($sale->transactions as $transaction) {
                if ($transaction->payment_method == 'Cash') {
                    CashLog::where('reference_id', $transaction->id)->where('source', 'sales')->delete();
                } else if ($transaction->payment_method == 'Credit') {
                    Contact::where('id', $sale->contact_id)->increment('balance', $transaction['amount']);
                }
                $transaction->delete();
            }
            $sale->deleted_by = Auth::id();
            $sale->save();
            // Delete the sale
            $sale->delete();
            DB::commit();

            $adminMail = Setting::where('meta_key', 'mail_settings')->first();
            $telegramSettings = Setting::where('meta_key', 'telegram_settings')->first();

            if ($telegramSettings) {
                $telegramSettings = json_decode($telegramSettings->meta_value, true);
                Notification::route('telegram', $telegramSettings['chat_id'])->notify(new SaleDeleted($sale, $telegramSettings['token']));
            }

            if ($adminMail) {
                $adminMail = json_decode($adminMail->meta_value, true);
                $adminMail = $adminMail['admin_email'];
                Notification::route('mail', $adminMail)->notify(new SaleDeleted($sale));
            }

            return response()->json(['success' => 'Sale deleted successfully'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function sendNotification($id)
    {
        $sale = Sale::select('sales.*', 'users.name as created_by')
            ->leftJoin('users', 'sales.created_by', '=', 'users.id')
            ->where('sales.id', $id)
            ->first();
        $adminMail = Setting::where('meta_key', 'mail_settings')->first();
        $telegramSettings = Setting::where('meta_key', 'telegram_settings')->first();

        if ($telegramSettings) {
            $telegramSettings = json_decode($telegramSettings->meta_value, true);
            Notification::route('telegram', $telegramSettings['chat_id'])->notify(new SaleCreated($sale, $telegramSettings['token']));
        }

        if ($adminMail) {
            $adminMail = json_decode($adminMail->meta_value, true);
            $adminMail = $adminMail['admin_email'];
            Notification::route('mail', $adminMail)->notify(new SaleCreated($sale));
        } else {
            return response()->json(['error' => 'Admin mail settings not found'], 404);
        }

        return response()->json(['success' => 'Notification sent successfully'], 200);
    }

    // api: /api/receipt-text-raw/{id}
    public function apiReceipt(Request $request, $id)
    {
        $settings = Setting::all();
        $settingArray = $settings->pluck('meta_value', 'meta_key')->all();
        $settingArray['shop_logo'] = 'public/' . $settingArray['shop_logo'];
        $isJson = $request->input('isJson');

        $sale = Sale::select(
            'sales.id',
            'contact_id',
            'sale_date',
            'sales.created_at',
            'total_amount',
            'discount',
            'amount_received',
            'status',
            'stores.address as store_address',
            'stores.sale_prefix',
            'stores.contact_number',
            'contacts.name as client_name',
            'sales.created_by',
            'invoice_number'
        )
            ->leftJoin('contacts', 'sales.contact_id', '=', 'contacts.id')
            ->join('stores', 'sales.store_id', '=', 'stores.id')
            ->where('sales.id', $id)
            ->first();

        if (!$sale) {
            return response()->json(['error' => 'Sale not found'], 404);
        }

        $user = User::find($sale->created_by);

        $saleItems = SaleItem::select(
            'sale_items.quantity',
            'sale_items.unit_price',
            'sale_items.discount',
            'sale_items.flat_discount',
            'sale_items.free_quantity',
            'products.name as product_name',
            DB::raw("CASE 
            WHEN products.product_type = 'reload' 
            THEN reload_and_bill_metas.account_number 
            ELSE NULL 
         END as account_number")
        )
            ->leftJoin('products', 'sale_items.product_id', '=', 'products.id')
            ->leftJoin('reload_and_bill_metas', function ($join) {
                $join->on('sale_items.id', '=', 'reload_and_bill_metas.sale_item_id')
                    ->where('products.product_type', '=', 'reload');
            })
            ->where('sale_items.sale_id', $id)
            ->get();

        // $text = $this->rawReceiptProductLineTemplate($sale, $user, $saleItems, $settingArray);
        $text = $this->rawReceiptProductSidedTemplate($sale, $user, $saleItems, $settingArray);

        if ($isJson) {
            return response()->json([
                'sale' => $sale,
                'siteLogo' => $settingArray['shop_logo'],
                'rawText' => $text,
            ], 200);
        }

        return response($text, 200)
            ->header('Content-Type', 'text/plain');
    }

    function formatQuantity($quantity)
    {
        if (fmod($quantity, 1) !== 0.0) {
            return number_format($quantity, 2);
        }
        return (int) $quantity;
    }

    public function rawReceiptProductLineTemplate($sale, $user, $saleItems, $settingArray)
    {
        $lineWidth  = 44;
        $lineSep    = str_repeat("-", $lineWidth) . "\r\n";
        $itemSep    = str_repeat(".", $lineWidth) . "\r\n";

        // columns (sum = 42)
        $colQty     = 6;   // "999x"
        $colUnit    = 10;  // unit price
        $colDisc    = 10;  // discount
        $colTotal   = 18;  // line total

        $summaryPad = 24;

        $text  = $lineSep;
        $text .= "Sale: " . $sale->sale_prefix . "/" . $sale->invoice_number . "\r\n";
        $text .= "Date: " . date('d-m-Y h:i A', strtotime($sale->created_at)) . "\r\n";
        $text .= "Client: " . $sale->client_name . "\r\n";
        $text .= "Created By: " . ($user ? $user->name : '-') . "\r\n";
        $text .= $lineSep;

        // items
        foreach ($saleItems as $index => $item) {
            $productName = $item->product_name;
            if ($item->account_number) {
                $productName .= " (Acc:" . $item->account_number . ")";
            }

            // Line 1 → product name
            $text .= '#' . str_pad(($index + 1) . '.', 2, '0', STR_PAD_LEFT) . $productName . "\r\n";

            // calculate values
            $qty   = $item->quantity;
            $unit  = number_format($item->unit_price, 2);
            $disc  = number_format($item->discount, 2);
            $total = number_format(($item->unit_price * $item->quantity) - $item->discount, 2);

            // Line 2 → aligned columns
            $lineQty   = str_pad($qty, $colQty, " ", STR_PAD_BOTH);
            $lineUnit  = str_pad($unit, $colUnit, " ", STR_PAD_LEFT);
            $lineDisc  = str_pad($disc, $colDisc, " ", STR_PAD_LEFT);
            if ($total == 0) {
                $lineTotal = str_pad('FREE', $colTotal, " ", STR_PAD_LEFT);
            } else {
                $lineTotal = str_pad($total, $colTotal, " ", STR_PAD_LEFT);
            }

            $text .= $lineQty . 'x' . $lineUnit . $lineDisc . $lineTotal . "\r\n";
            if ($index < count($saleItems) - 1) {
                $text .= $itemSep;
            }
        }

        $text .= $lineSep;
        $text .= str_pad("Total:", $summaryPad, " ", STR_PAD_RIGHT) . str_pad(number_format($sale->total_amount + $sale->discount, 2), 20, " ", STR_PAD_LEFT) . "\r\n";
        $text .= str_pad("Discount:", $summaryPad, " ", STR_PAD_RIGHT) . str_pad(number_format($sale->discount, 2), 20, " ", STR_PAD_LEFT) . "\r\n";
        $text .= str_pad("Net Total:", $summaryPad, " ", STR_PAD_RIGHT) . str_pad(number_format($sale->total_amount, 2), 20, " ", STR_PAD_LEFT) . "\r\n";
        $text .= str_pad("Paid:", $summaryPad, " ", STR_PAD_RIGHT) . str_pad(number_format($sale->amount_received, 2), 20, " ", STR_PAD_LEFT) . "\r\n";
        $text .= str_pad("Change:", $summaryPad, " ", STR_PAD_RIGHT) . str_pad(number_format($sale->amount_received - $sale->total_amount, 2), 20, " ", STR_PAD_LEFT) . "\r\n\n";
        $text .= $settingArray['sale_receipt_note'] . "\r\n\n";

        return $text;
    }
    public function rawReceiptProductSidedTemplate($sale, $user, $saleItems, $settingArray)
    {
        $lineWidth = 48;
        $lineSep = str_repeat("-", $lineWidth) . "\r\n";
        $itemSep = str_repeat(".", $lineWidth) . "\r\n";

        // Define fixed column widths
        $colQty     = 10;   // "999x"
        $colUnit    = 12;  // unit price
        $colTotal   = 18;  // line total

        $summaryPad = 24;
        $text = $lineSep;
        $text .= "Sale: " . $sale->sale_prefix . "/" . $sale->invoice_number . "\r\n";
        $text .= "Date: " . date('d-m-Y h:i A', strtotime($sale->created_at)) . "\r\n";
        $text .= "Client: " . $sale->client_name . "\r\n";
        $text .= "Created By: " . ($user ? $user->name : '-') . "\r\n";
        $text .= $lineSep;

        foreach ($saleItems as $index => $item) {
            $productName = $item->product_name;
            if ($item->account_number) {
                $productName .= " (Acc:" . $item->account_number . ")";
            }

            $unit  = number_format($item->unit_price, 2);
            $disc = ($item->discount*$item->quantity)+$item->flat_discount;
            $total = number_format(($item->unit_price * $item->quantity) - $disc, 2);

            // Calculate space for product name (everything before the 'Total' column)
            $spaceBeforeTotal = $lineWidth - $colTotal;
            $prefix = '#' . str_pad(($index + 1) . '.', 2, '0', STR_PAD_LEFT) . ' ';

            // Wrap product name to fit available width
            $lines = [];
            $words = explode(' ', $productName);
            $currentLine = $prefix;
            foreach ($words as $word) {
                if (strlen($currentLine . $word) + 1 > $spaceBeforeTotal) {
                    $lines[] = $currentLine;
                    $currentLine = '   ' . $word; // indent wrapped lines
                } else {
                    $currentLine .= ($currentLine === $prefix ? '' : ' ') . $word;
                }
            }
            $lines[] = $currentLine;

            // Add wrapped product name lines
            foreach ($lines as $line) {
                $text .= $line . "\r\n";
            }

            // Line 2 → aligned columns
            $lineQty   = str_pad('   ' . $item->quantity . ($item->free_quantity !=0 ? '+[Free: ' . $this->formatQuantity($item->free_quantity) . ']' : ''), $colQty, " ", STR_PAD_BOTH);
            $lineUnit  = str_pad($unit, $colUnit, " ", STR_PAD_LEFT);
            $lineTotal = ($disc == 0) ? str_pad($total, $colTotal, " ", STR_PAD_LEFT) : str_pad('(' . ($disc)*-1 . ') ' . $total, $colTotal, " ", STR_PAD_LEFT);

            $text .= $lineUnit .$lineQty. $lineTotal . "\r\n";

            if ($index < count($saleItems) - 1) {
                $text .= $itemSep;
            }
        }

        $text .= $lineSep;
        $text .= str_pad("Total:", $summaryPad, " ", STR_PAD_RIGHT) . str_pad(number_format($sale->total_amount + $sale->discount, 2), 24, " ", STR_PAD_LEFT) . "\r\n";
        $text .= str_pad("Discount:", $summaryPad, " ", STR_PAD_RIGHT) . str_pad(number_format($sale->discount, 2), 24, " ", STR_PAD_LEFT) . "\r\n";
        $text .= str_pad("Net Total:", $summaryPad, " ", STR_PAD_RIGHT) . str_pad(number_format($sale->total_amount, 2), 24, " ", STR_PAD_LEFT) . "\r\n";
        $text .= str_pad("Paid:", $summaryPad, " ", STR_PAD_RIGHT) . str_pad(number_format($sale->amount_received, 2), 24, " ", STR_PAD_LEFT) . "\r\n";
        $text .= str_pad("Change:", $summaryPad, " ", STR_PAD_RIGHT) . str_pad(number_format($sale->amount_received - $sale->total_amount, 2), 24, " ", STR_PAD_LEFT) . "\r\n\n";
        $text .= $settingArray['sale_receipt_note'] . "\r\n\n";

        return $text;
    }
}
