<?php

namespace App\Http\Controllers;

use App\Models\TaxAndFee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaxAndFeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $taxAndFee = TaxAndFee::all();

        return Inertia::render('TaxAndFee/TaxAndFee', [
            'taxesAndFees' => $taxAndFee,
            'pageLabel'=>'Taxes and Fees',
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {

    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:255'],
            'rate' => ['required', 'numeric', 'min:0'],
        ]);

        $taxAndFee = TaxAndFee::create([
            'name' => $request->name,
            'type' => $request->type,
            'rate' => $request->rate,
            'is_percentage' => isset($request->is_percentage),
        ]);

        return response()->json([
            'message' => 'Tax or Fee added successfully',
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(TaxAndFee $taxAndFee)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(TaxAndFee $taxAndFee)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, TaxAndFee $taxAndFee)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $taxAndFee = TaxAndFee::find($id);
        $taxAndFee->delete();

        return response()->json([
            'message' => 'Tax or Fee deleted successfully',
        ]);
    }
}
