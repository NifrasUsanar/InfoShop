<?php

namespace App\Http\Controllers;

use App\Models\ProductBatch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\QuantityAdjustment;
use App\Models\ProductStock;
use App\Models\SaleItem;

use Illuminate\Support\Facades\DB;

class QuantityController extends Controller
{
    public function store(Request $request)
    {
        // Validate the incoming request data
        $validated = $request->validate([
            'batch_id' => 'required',
            'stock_id' => 'nullable|integer',  // Can be null to create a new ProductStock
            'quantity' => 'required',
            'reason' => 'required|string',
            'store_id' => 'required|integer',
        ]);

        // Start database transaction to ensure atomicity
        DB::beginTransaction();

        try {
            // Attempt to find existing ProductStock by store_id and batch_id
            $productStock = ProductStock::where('store_id', $validated['store_id'])
                ->where('batch_id', $validated['batch_id'])
                ->first();

            if ($productStock) {
                // If stock exists, update the quantity
                $previousQuantity = $productStock->quantity;
                $productStock->quantity += $validated['quantity'];
                $productStock->save();
            } else {
                $product = ProductBatch::find($validated['batch_id']);
                // If stock doesn't exist, create a new ProductStock record
                $productStock = ProductStock::create([
                    'store_id' => $validated['store_id'],
                    'batch_id' => $validated['batch_id'],
                    'quantity' => $validated['quantity'],
                    'product_id' => $product->product_id
                ]);

                // Since this is a new record, previous quantity will be 0
                $previousQuantity = 0;
            }

            // Create a new QuantityAdjustment record
            $quantityAdjustment = new QuantityAdjustment([
                'batch_id' => $validated['batch_id'],
                'stock_id' => $productStock->id,
                'previous_quantity' => $previousQuantity,
                'adjusted_quantity' => $validated['quantity'],
                'reason' => $validated['reason'],
            ]);

            $quantityAdjustment->save();

            // Commit transaction
            DB::commit();

            // Return success response
            return response()->json(['message' => 'Quantity adjustment and stock update successful.'], 200);
        } catch (\Exception $e) {
            // Rollback transaction in case of error
            DB::rollBack();

            // Return error response
            return response()->json(['error' => $e], 500);
        }
    }
    public function getAdjustmentsLog($stock_id)
    {
        // Get the ProductStock to find batch_id
        $productStock = ProductStock::findOrFail($stock_id);
        $batchId = $productStock->batch_id;

        // Fetch manual quantity adjustments
        $manualAdjustments = QuantityAdjustment::where('stock_id', $stock_id)
            ->join('product_stocks', 'quantity_adjustments.stock_id', '=', 'product_stocks.id')
            ->join('products', 'product_stocks.product_id', '=', 'products.id')
            ->select(
                'quantity_adjustments.id',
                'quantity_adjustments.created_at',
                'products.name',
                'quantity_adjustments.previous_quantity',
                'quantity_adjustments.adjusted_quantity',
                'quantity_adjustments.reason',
                DB::raw("'adjustment' as type")
            )
            ->get();

        // Fetch sales (deductions from sale_items)
        $sales = SaleItem::where('batch_id', $batchId)
            ->where('item_type', '!=', 'charge')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->select(
                'sale_items.id',
                'sale_items.created_at',
                'products.name',
                DB::raw('0 as previous_quantity'),
                DB::raw("CAST(-sale_items.quantity AS DECIMAL(10,2)) as adjusted_quantity"),
                DB::raw("CONCAT('Sale #', sales.invoice_number) as reason"),
                DB::raw("'sale' as type")
            )
            ->get();

        // Combine both collections
        $allAdjustments = $manualAdjustments->concat($sales)
            ->sortByDesc('created_at')
            ->values();

        return Inertia::render('Product/QuantityAdjustmentsLog', [
            'adjustments' => $allAdjustments,
            'pageLabel' => 'Quantity Adjustments Log',
        ]);
    }
}
