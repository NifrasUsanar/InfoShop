<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Store;
use App\Models\Contact;
use App\Models\Setting;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class QuotationController extends Controller
{

    public function store(Request $request)
    {
        $request->validate([
            'contact_id' => 'required|numeric',
            'customer_notes' => 'required',
            'expiry_date' => 'required|date',
            'profit_amount' => 'required|numeric',
            'quotation_date' => 'required|date',
            'terms_conditions' => 'required',
        ]);

        DB::beginTransaction();
        try {
            $quotation = new Quotation();
            $quotation->contact_id = $request->input('contact_id');
            $quotation->customer_notes = $request->input('customer_notes');
            $quotation->expiry_date = $request->input('expiry_date');
            $quotation->profit = $request->input('profit_amount');
            $quotation->quotation_date = $request->input('quotation_date');
            $quotation->terms_conditions = $request->input('terms_conditions');
            $quotation->total = $request->input('total');
            $quotation->store_id = session('store_id', Auth::user()->store_id);
            $quotation->quotation_number = 'QTN';
            $quotation->subtotal = 0;

            $quotation->save();

            $quotation_number = 'QTN' . str_pad($quotation->id, 4, '0', STR_PAD_LEFT);
            $quotation->quotation_number = $quotation_number;
            $quotation->save();

            // Save quotation items
            $items = $request->input('cartItems');
            foreach ($items as $item) {
                $quotationItem = new QuotationItem();
                $quotationItem->quotation_id = $quotation->id;
                $quotationItem->product_id = $item['id'];
                $quotationItem->custom_description = isset($item['description']) ? $item['description'] : '';
                $quotationItem->price = $item['price'];
                $quotationItem->quantity = $item['quantity'];
                $quotationItem->cost = $item['cost'] ?? 0;
                $quotationItem->total = ($item['price'] * $item['quantity']) - ($item['discount'] ?? 0) * $item['quantity'];
                $quotationItem->discount = $item['discount'] ?? 0;
                $quotationItem->batch_id = $item['batch_id'] ?? null;
                $quotationItem->save();
            }

            DB::commit();

            return response()->json(['success' => 'Quotation created successfully'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating quotation: ' . $e->getMessage());

            return response()->json(['error' => 'Failed to create quotation'], 500);
        }
    }

    public function index()
    {
        $stores = Store::select('id', 'name')->get();

        $quotations = Quotation::select('quotations.*', 'contacts.name as contact_name')
            ->join('contacts', 'quotations.contact_id', '=', 'contacts.id')
            ->paginate(50);

        return Inertia::render('Quotation/Quotation', [
            'quotations' => $quotations,
            'stores' => $stores,
            'pageLabel' => 'Quotations',
        ]);
    }

    public function destroy($id)
    {
        try {
            $quotation = Quotation::findOrFail($id);
            $quotation->delete();

            return response()->json(['success' => 'Quotation deleted successfully'], 200);
        } catch (\Exception $e) {
            Log::error('Error deleting quotation: ' . $e->getMessage());

            return response()->json(['error' => 'Failed to delete quotation'], 500);
        }
    }

    public function show($id)
    {
        $template = Setting::where('meta_key', 'quotation-template')->first();
        $quotation = Quotation::with(['quotationItems' => function ($q) {
            $q->join('products', 'quotation_items.product_id', '=', 'products.id')
                ->select('quotation_items.*', 'products.name as product_name');
        }, 'contact'])->find($id);
        // $contact = Contact::find($quotation->contact_id);
        // $quotation->contact = $contact;

        return Inertia::render('Quotation/QuotationView', [
            'quotation' => $quotation,
            'template' => $template?->meta_value,
        ]);
    }
}
