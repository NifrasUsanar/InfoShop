<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CashLog;
use App\Models\Store;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Sale;
use App\Models\Purchase;
use App\Models\Contact;
use App\Models\Transaction;
use App\Models\PurchaseTransaction;
use App\Models\PurchaseItem;
use App\Models\SaleItem;
use App\Models\User;
use App\Models\Expense;
use App\Models\SalaryRecord;
use Illuminate\Support\Facades\Auth;

class ReportController extends Controller
{
    public function getDailyCashReport(Request $request)
    {
        $transaction_date = $request->only(['transaction_date']);
        $user = $request->user;
        $store_id = $request->store_id;

        if (empty($transaction_date)) $transaction_date = Carbon::today()->toDateString();

        $stores = Store::forCurrentUser()->select('id', 'name')->get();
        if (Auth::user()->user_role !== 'admin' && Auth::user()->user_role !== 'super-admin') {
            $users = User::where('id', Auth::id())->select('id', 'name')->get();
        } else {
            $users = User::where('user_role', '!=', 'super-admin')->select('id', 'name')->get();
        }

        $cashLogs = CashLog::where('cash_logs.transaction_date', $transaction_date)
            ->select(
                'cash_logs.transaction_date',
                'description',
                'cash_logs.amount',
                'cash_logs.source',
                'contacts.name',
                'transactions.sales_id',
                DB::raw('CASE WHEN cash_logs.amount > 0 THEN cash_logs.amount ELSE 0 END AS cash_in'),
                DB::raw('CASE WHEN cash_logs.amount < 0 THEN ABS(cash_logs.amount) ELSE 0 END AS cash_out'),
                DB::raw('
                    CASE 
                        WHEN cash_logs.source = "sales" THEN transactions.transaction_type 
                        WHEN cash_logs.source = "purchases" THEN purchase_transactions.transaction_type 
                        ELSE NULL 
                    END AS transaction_type
                ')
            )
            ->leftJoin('contacts', 'cash_logs.contact_id', '=', 'contacts.id')
            ->leftJoin('transactions', function ($join) {
                $join->on('cash_logs.reference_id', '=', 'transactions.id')
                    ->where('cash_logs.source', '=', 'sales');
            })
            ->leftJoin('purchase_transactions', function ($join) {
                $join->on('cash_logs.reference_id', '=', 'purchase_transactions.id')
                    ->where('cash_logs.source', '=', 'purchases');
            });

        if (isset($user) && $user !== 'All') {
            $cashLogs = $cashLogs->where('cash_logs.created_by', $user);
        }

        if (isset($store_id) && $store_id !== 'All') {
            $cashLogs = $cashLogs->where('cash_logs.store_id', $store_id);
        }

        if (Auth::user()->user_role === 'admin' || Auth::user()->user_role === 'super-admin') {
        } else {
            if (!isset($store_id)) {
                $cashLogs = $cashLogs->where('cash_logs.store_id', Auth::user()->store_id);
            }
        }


        $cashLogs = $cashLogs->get();
        return Inertia::render('Report/DailyCashReport', [
            'stores' => $stores,
            'logs' => $cashLogs,
            'users' => $users,
            'pageLabel' => 'Daily Cash Report',
        ]);
    }

    public function storeDailyCashReport(Request $request)
    {

        $request->validate([
            'amount' => 'required|numeric|min:0.01', // Ensure amount is a positive number
            'transaction_date' => 'required|date',
            'transaction_type' => 'required|in:deposit,withdrawal,open_cashier,close_cashier',
            'description' => 'nullable|string|max:255',
            'store_id' => 'required|exists:stores,id',
        ]);

        $amount = $request->amount;
        $description = $request->description;
        $source = $request->transaction_type;

        if ($request->transaction_type === 'deposit') {
            $amount = abs($amount);
            $actualTransactionType = 'cash_in';
        } elseif ($request->transaction_type === 'withdrawal') {
            $amount = -abs($amount);
            $actualTransactionType = 'cash_out';
        } elseif ($request->transaction_type === 'open_cashier') {
            $amount = abs($amount); // Opening cashier balance should be positive
            $actualTransactionType = 'cash_in';
            $description = $description ?: "Opening Cashier Balance";
            $source = 'deposit';
        } elseif ($request->transaction_type === 'close_cashier') {
            $amount = -abs($amount); // Closing cashier balance as negative cash out
            $actualTransactionType = 'cash_out';
            $source = 'withdrawal';
            $description = $description ?: "Closing Cashier Balance";
        }
        // Create a new Transaction instance
        $cashLog = new CashLog();
        $cashLog->description = $request->description;
        $cashLog->amount = $amount;
        $cashLog->transaction_date = $request->transaction_date;
        $cashLog->transaction_type = $actualTransactionType;
        $cashLog->store_id = $request->store_id;
        $cashLog->source = $source;
        // Save the transaction
        $cashLog->save();

        // Return a success response
        return response()->json([
            'message' => "Transaction added successfully",
        ], 200);
    }

    public function getSalesReport(Request $request)
    {
        $start_date = $request->input('start_date', Carbon::now()->toDateString());
        $end_date = $request->input('end_date', Carbon::today()->toDateString());
        $store_id = $request->input('store');

        // Filter Sales within the specified date range
        $salesQuery = Sale::with(['transactions' => function ($query) use ($start_date, $end_date) {
            // Filter transactions within the date range
            $query->whereBetween('transaction_date', [$start_date, $end_date])
                ->whereNotIn('payment_method', ['Credit'])
                ->select('id', 'sales_id', 'transaction_date', 'amount', 'payment_method', 'transaction_type')
                ->orderBy('transaction_date', 'asc');
        }])
            ->select('id', 'invoice_number', 'sale_date', 'total_amount', 'profit_amount', 'status', 'store_id', 'discount')
            ->whereBetween('sale_date', [$start_date, $end_date]) // Filter Sales within the specified date range
            ->orderBy('sale_date', 'desc');

        if (isset($store_id) && $store_id !== 'All') {
            $salesQuery->where('store_id', $store_id);
        }
        // Execute the query to get the sales
        $sales = $salesQuery->get();
        $report = [];

        // Loop through each sale to build the report
        foreach ($sales as $sale) {
            // Add the Sale record to the report
            $report[] = [
                'date' => $sale->sale_date,
                'description' => "Sale #{$sale->invoice_number}",
                'receivable' => $sale->total_amount,
                'settled' => 0, // To be calculated based on transactions
                'profit' => $sale->profit_amount,
                'sales_id' => $sale->id,
            ];

            // Add the related Transaction records
            foreach ($sale->transactions as $transaction) {
                $transactionDescription = ucfirst($transaction->payment_method) . ' | #' . $sale->invoice_number;
                $report[] = [
                    'date' => $transaction->transaction_date,
                    'description' => $transactionDescription,
                    'receivable' => 0, // Transactions don’t affect receivables
                    'settled' => $transaction->amount, // Amount settled in the transaction
                    'profit' => 0, // Transactions don’t affect profit directly
                    'sales_id' => $sale->id,
                ];
            }
        }

        usort($report, function ($a, $b) {
            return strtotime($a['date']) - strtotime($b['date']);
        });

        // return response()->json($report);

        $stores = Store::forCurrentUser()->select('id', 'name')->get();
        return Inertia::render('Report/SalesReport', [
            'stores' => $stores,
            'report' => $report,
            'pageLabel' => 'Sales Report',
        ]);
    }

    public function getCustomerReport(Request $request, $id)
    {
        $start_date = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $end_date = $request->input('end_date', Carbon::today()->toDateString());
        $contact_id = $id;

        // Fetch sales for the customer within the date range
        $salesQuery = Sale::with(['transactions' => function ($query) use ($start_date, $end_date) {
            // Filter transactions (payments and refunds) within the date range
            $query->whereBetween('transaction_date', [$start_date, $end_date])
                ->whereNotIn('payment_method', ['Credit', 'Account'])
                ->select('id', 'sales_id', 'transaction_date', 'amount', 'payment_method', 'transaction_type')
                ->orderBy('transaction_date', 'asc');
        }])
            ->select('id', 'invoice_number', 'sale_date', 'total_amount', 'profit_amount', 'status', 'store_id', 'contact_id')
            ->where('contact_id', $contact_id) // Filter sales for the specific customer
            ->whereBetween('sale_date', [$start_date, $end_date]) // Filter within the date range
            ->orderBy('sale_date', 'asc');

        // Execute the query to get sales
        $sales = $salesQuery->get();
        $report = [];

        // Calculate previous credits (payments) made by the customer
        $previousCredits = Transaction::where('contact_id', $contact_id)
            ->where('transaction_date', '<', $start_date)
            ->whereNotIn('payment_method', ['Credit', 'Account'])
            ->sum('amount');

        // If the sum of previous credits is negative, treat it as a debit
        $previousDebitsFromCredits = $previousCredits < 0 ? abs($previousCredits) : 0; // Refunds or negative credits treated as debits

        // Calculate the previous debits (amounts owed by the customer)
        $previousDebits = Sale::where('contact_id', $contact_id)
            ->where('sale_date', '<', $start_date)
            ->sum('total_amount');

        // Combine both previous debits and credits into a single row
        $report = [
            [
                'date' => '-', // Static label to show it's previous data
                'description' => 'Previous Balance', // Combined previous data
                'debit' => $previousDebits + $previousDebitsFromCredits, // Previous Debits + Refunds (treated as debit)
                'credit' => $previousCredits > 0 ? $previousCredits : 0, // Previous Credits (positive amounts paid)
            ],
        ];

        // Loop through each sale to build the report
        foreach ($sales as $sale) {
            // Add the Sale record to the report (debit - amount owed)
            $report[] = [
                'date' => $sale->sale_date,
                'description' => "Sale #{$sale->invoice_number}",
                'debit' => $sale->total_amount, // Amount owed by customer
                'credit' => 0, // No payment yet
            ];

            // Add related Transaction records (payment or refund - credit)
            foreach ($sale->transactions as $transaction) {
                $transactionDescription = ucfirst($transaction->payment_method) . ' | #' . $sale->invoice_number;
                $report[] = [
                    'date' => $transaction->transaction_date,
                    'description' => $transactionDescription,
                    'debit' => 0, // No amount owed due to the payment
                    'credit' => $transaction->amount, // Amount paid by the customer
                ];
            }
        }

        $independentTransactions = Transaction::where('contact_id', $id)
            ->whereNull('sales_id') // These transactions are not linked to any sale
            ->whereBetween('transaction_date', [$start_date, $end_date]) // Filter within the date range
            ->orderBy('transaction_date', 'asc')
            ->get();

        foreach ($independentTransactions as $transaction) {
            $transactionDescription = ucfirst($transaction->payment_method) . ' #' . str_pad($transaction->id, 4, '0', STR_PAD_LEFT) . ($transaction->note ? ' | ' . $transaction->note : '');
            // Check if transaction type is 'account' and the amount is negative, then treat it as debit
            if ($transaction->transaction_type === 'account' && $transaction->amount < 0) {
                $debit = abs($transaction->amount); // Negative amount means debit (amount owed)
                $credit = 0; // No credit in this case
            } else {
                $debit = 0; // No amount owed for other transaction types
                $credit = $transaction->amount; // Amount paid by the customer
            }

            $report[] = [
                'date' => $transaction->transaction_date,
                'description' => $transactionDescription,
                'debit' => $debit, // Amount owed (if it's an 'account' transaction with a negative amount)
                'credit' => $credit, // Amount paid (for other cases)
            ];
        }

        usort($report, function ($a, $b) {
            return strtotime($a['date']) - strtotime($b['date']);
        });

        // return response()->json($report)

        $stores = Store::forCurrentUser()->select('id', 'name')->get();
        $contacts = Contact::select('id', 'name', 'balance')->customers()->get();
        $contact = Contact::find($contact_id);
        return Inertia::render('Report/ContactReport', [
            'stores' => $stores,
            'report' => $report,
            'contacts' => $contacts,
            'contact' => $contact,
            'type' => 'customer',
            'pageLabel' => 'Customer Report',
            'previousCredits' => $previousCredits,
            'previousDebits' => $previousDebits,
        ]);
    }

    public function getVendorReport(Request $request, $id)
    {
        $start_date = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $end_date = $request->input('end_date', Carbon::today()->toDateString());
        $contact_id = $id;

        // Fetch purchases from the supplier within the date range
        $purchasesQuery = Purchase::with(['transactions' => function ($query) use ($start_date, $end_date) {
            // Filter transactions (payments and refunds) within the date range
            $query->whereBetween('transaction_date', [$start_date, $end_date])
                ->whereNotIn('payment_method', ['Credit', 'Account'])
                ->select('id', 'purchase_id', 'transaction_date', 'amount', 'payment_method', 'transaction_type')
                ->orderBy('transaction_date', 'asc');
        }])
            ->select('id', 'reference_no', 'purchase_date', 'total_amount', 'discount', 'amount_paid', 'status', 'store_id', 'contact_id')
            ->where('contact_id', $contact_id) // Filter purchases for the specific supplier
            ->whereBetween('purchase_date', [$start_date, $end_date]) // Filter within the date range
            ->orderBy('purchase_date', 'asc');

        // Execute the query to get purchases
        $purchases = $purchasesQuery->get();
        $report = [];

        // Calculate previous credits (payments made to the supplier before the date range)
        $previousCredits = PurchaseTransaction::where('contact_id', $contact_id)
            ->where('transaction_date', '<', $start_date)
            ->whereNotIn('payment_method', ['Credit', 'Account'])
            ->sum('amount');

        // If the sum of previous credits is negative, treat it as a debit
        $previousDebitsFromCredits = $previousCredits < 0 ? abs($previousCredits) : 0; // Refunds or negative credits treated as debits

        // Calculate the previous debits (purchases owed to the supplier before the date range)
        $previousDebits = Purchase::where('contact_id', $contact_id)
            ->where('purchase_date', '<', $start_date)
            ->sum('total_amount');

        // Combine both previous debits and credits into a single row
        $report[] = [
            'date' => '-', // Static label to show it's previous data
            'description' => 'Previous Balance', // Combined previous data
            'debit' => $previousDebits + $previousDebitsFromCredits, // Previous Debits + Refunds (treated as debit)
            'credit' => $previousCredits > 0 ? $previousCredits : 0, // Previous Credits (positive amounts paid)
        ];

        // Loop through each purchase to build the report
        foreach ($purchases as $purchase) {
            // Add the Purchase record to the report (debit - amount owed to the supplier)
            $report[] = [
                'date' => $purchase->purchase_date,
                'description' => "Purchase #{$purchase->reference_no}",
                'debit' => $purchase->total_amount, // Amount owed to the supplier
                'credit' => 0, // No payment yet
            ];

            // Add related Transaction records (payment or refund - credit)
            foreach ($purchase->transactions as $transaction) {
                $transactionDescription = ucfirst($transaction->payment_method) . ' | #' . $purchase->reference_no;
                $report[] = [
                    'date' => $transaction->transaction_date,
                    'description' => $transactionDescription,
                    'debit' => 0, // No amount owed due to the payment
                    'credit' => $transaction->amount, // Amount paid to the supplier
                ];
            }
        }

        // Include independent transactions (e.g., payments not linked to purchases)
        $independentTransactions = PurchaseTransaction::where('contact_id', $id)
            ->whereNull('purchase_id') // These transactions are not linked to any purchase
            ->whereBetween('transaction_date', [$start_date, $end_date]) // Filter within the date range
            ->orderBy('transaction_date', 'asc')
            ->get();

        foreach ($independentTransactions as $transaction) {
            $transactionDescription = ucfirst($transaction->payment_method) . ($transaction->note ? ' | ' . $transaction->note : '');
            // Check if transaction type is 'account' and the amount is negative, then treat it as debit
            if ($transaction->transaction_type === 'account' && $transaction->amount < 0) {
                $debit = abs($transaction->amount); // Negative amount means debit (amount owed)
                $credit = 0; // No credit in this case
            } else {
                $debit = 0; // No amount owed for other transaction types
                $credit = $transaction->amount; // Amount paid to the supplier
            }

            $report[] = [
                'date' => $transaction->transaction_date,
                'description' => $transactionDescription,
                'debit' => $debit, // Amount owed (if it's an 'account' transaction with a negative amount)
                'credit' => $credit, // Amount paid (for other cases)
            ];
        }

        // Sort the report by date
        usort($report, function ($a, $b) {
            return strtotime($a['date']) - strtotime($b['date']);
        });

        $stores = Store::forCurrentUser()->select('id', 'name')->get();
        $contacts = Contact::select('id', 'name', 'balance')->vendors()->get();
        $contact = Contact::find($contact_id);
        return Inertia::render('Report/ContactReport', [
            'stores' => $stores,
            'report' => $report,
            'contacts' => $contacts,
            'contact' => $contact,
            'type' => 'vendor',
            'pageLabel' => 'Vendor Report',
            'previousCredits' => $previousCredits,
            'previousDebits' => $previousDebits,
        ]);
    }

    public function viewOrderDetails(Request $request, $type)
    {
        $transaction_id = $request->transaction_id;
        $query = ($type === 'sale') ? Transaction::query() : PurchaseTransaction::query();
        $query = $query->select('amount', 'payment_method', 'transaction_date', 'id', 'parent_id');
        $query = ($type === 'sale') ? $query->where('sales_id', $transaction_id) : $query->where('purchase_id', $transaction_id);
        $paymentResults = $query->get();
        // Item Query
        $itemQuery = ($type === 'sale') ? SaleItem::query() : PurchaseItem::query();
        $itemQuery = $itemQuery->select(
            'batch_number',
            DB::raw(($type === 'sale') ? 'sale_items.quantity as quantity' : 'purchase_items.quantity as quantity'),
            'unit_price',
            'unit_cost',
            DB::raw(($type === 'sale') ? 'sale_items.discount as discount' : 'purchase_items.discount as discount'),
            DB::raw('COALESCE(products.name, ' .
                ($type === 'sale' ? 'sale_items.description' : 'purchase_items.description') . ') as name')
        );

        // Join with the products table to get the product name
        if ($type === 'sale') {
            $itemQuery = $itemQuery->leftJoin('products', 'sale_items.product_id', '=', 'products.id')
                ->leftJoin('product_batches', 'sale_items.batch_id', '=', 'product_batches.id')
                ->where('sale_items.sale_id', $transaction_id);
        } else {
            $itemQuery = $itemQuery->leftJoin('products', 'purchase_items.product_id', '=', 'products.id')
                ->leftJoin('product_batches', 'purchase_items.batch_id', '=', 'product_batches.id')
                ->where('purchase_items.purchase_id', $transaction_id);
        }

        // Get the details of the sale or purchase
        $detailsQuery = ($type === 'sale') ? Sale::query() : Purchase::query();
        $detailsQuery = $detailsQuery->select(
            'contacts.name as contact_name',
            'total_amount',
            'discount',
            DB::raw(($type === 'sale') ? 'sales.sale_date as date' : 'purchases.purchase_date as date')
        );
        $detailsQuery = $detailsQuery->leftJoin('contacts', ($type === 'sale') ? 'sales.contact_id' : 'purchases.contact_id', '=', 'contacts.id');
        $detailsQuery = $detailsQuery->where(($type === 'sale') ? 'sales.id' : 'purchases.id', $transaction_id);
        $details = $detailsQuery->first();

        // Execute the query and get the item results
        $itemResults = $itemQuery->get();

        // Return both payment and item results as a JSON response
        return response()->json([
            'payments' => $paymentResults,
            'items' => $itemResults,
            'details' => $details
        ]);
    }

    public function getSummaryReport()
    {
        $stores = Store::forCurrentUser()->select('id', 'name')->get();

        $start_date = request()->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $end_date = request()->input('end_date', Carbon::today()->toDateString());
        $store_id = request()->input('store', 'All');

        $report = [];
        $sales = Sale::StoreId($store_id)
            ->DateFilter($start_date, $end_date)
            ->selectRaw('
                SUM(total_amount) as total_sales,
                SUM(CASE WHEN total_amount < amount_received THEN total_amount ELSE amount_received END) as total_received,
                SUM(profit_amount) as total_profit,
                SUM(discount) as sale_discount
            ')
            ->first();

        $report['total_sales'] = $sales->total_sales;
        $report['total_received'] = $sales->total_received;
        $report['total_profit'] = $sales->total_profit;

        $sale_items = SaleItem::StoreId($store_id)
            ->DateFilter($start_date, $end_date)
            ->selectRaw('SUM((quantity * discount) + flat_discount) as total_discount')
            ->first();

        $report['total_discount'] = $sale_items->total_discount + $sales->sale_discount;
        $report['total_expenses'] = Expense::StoreId($store_id)->DateFilter($start_date, $end_date)->sum('amount');
        $report['cash_sale'] = Transaction::StoreId($store_id)->DateFilter($start_date, $end_date)->where('payment_method', 'cash')->where('amount', '>=', 0)->sum('amount');
        $report['cash_refund'] = Transaction::StoreId($store_id)->DateFilter($start_date, $end_date)->where('payment_method', 'cash')->where('amount', '<', 0)->sum('amount');
        $report['cash_purchase'] = PurchaseTransaction::StoreId($store_id)->DateFilter($start_date, $end_date)->where('payment_method', 'cash')->sum('amount');
        $report['salary_expense'] = SalaryRecord::StoreId($store_id)->DateFilter($start_date, $end_date)->sum('net_salary');
        $report['total_expenses'] += $report['salary_expense'];
        return Inertia::render('Report/SummaryReport', [
            'pageLabel' => 'Summary Report',
            'stores' => $stores,
            'report' => $report,
        ]);
    }
}
