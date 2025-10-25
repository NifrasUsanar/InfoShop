<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Charge;
use Inertia\Inertia;

class ChargeController extends Controller
{
    public function index()
    {
        $charges = Charge::paginate(15);

        return Inertia::render('Charges/Index', [
            'charges' => [
                'data' => $charges->items(),
                'links' => $charges->links(),
            ],
            'chargeTypes' => [
                'tax',
                'service_charge',
                'delivery_fee',
                'discount',
                'gratuity',
                'custom',
            ],
            'rateTypes' => ['percentage', 'fixed'],
            'pageLabel' => 'Charges & Taxes',
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:charges,name',
            'charge_type' => 'required|string',
            'rate_value' => 'required|numeric|min:0',
            'rate_type' => 'required|in:percentage,fixed',
            'description' => 'nullable|string',
            'is_active' => 'boolean|nullable',
            'is_default' => 'boolean|nullable',
        ]);

        $charge = Charge::create($validated);

        return redirect()->route('charges.index')
            ->with('message', 'Charge created successfully!');
    }

    public function update(Request $request, Charge $charge)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:charges,name,' . $charge->id,
            'charge_type' => 'required|string',
            'rate_value' => 'required|numeric|min:0',
            'rate_type' => 'required|in:percentage,fixed',
            'description' => 'nullable|string',
            'is_active' => 'boolean|nullable',
            'is_default' => 'boolean|nullable',
        ]);

        $charge->update($validated);

        return back()->with('message', 'Charge updated successfully!');
    }

    public function destroy(Charge $charge)
    {
        // Check if charge is in use in any sale items
        $saleItemsCount = $charge->saleItems()->count();

        if ($saleItemsCount > 0) {
            return response()->json(
                ['message' => "Cannot delete this charge. It is being used in {$saleItemsCount} sale(s)."],
                409
            );
        }

        $charge->delete();

        return redirect()->route('charges.index')
            ->with('message', 'Charge deleted successfully!');
    }

    public function getActive()
    {
        $charges = Charge::active()->get();

        return response()->json($charges);
    }

    public function getDefault()
    {
        $charges = Charge::default()->get();

        return response()->json($charges);
    }
}
