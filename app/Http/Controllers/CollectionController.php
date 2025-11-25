<?php

namespace App\Http\Controllers;

use App\Models\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class CollectionController extends Controller
{
    public function index()
    {
        // Fetch data from the Collection model with parent relationship
        $collections = Collection::with('parent')
            ->select('id', 'name', 'collection_type', 'description', 'parent_id', 'created_at')
            ->get();
        
        // Get all collections for parent dropdown (excluding children to prevent circular references)
        $allCollections = Collection::select('id', 'name', 'parent_id')->get();
        
        // Render the Inertia view with the collections data
        return Inertia::render('Collection/Collection', [
            'collections' => $collections,
            'allCollections' => $allCollections,
            'pageLabel' => 'Collections',
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|unique:collections,name', // 'name' must be unique
            'collection_type' => 'required|string|max:50',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:collections,id', // Validate parent exists
        ]);
        $validatedData['slug'] = Str::slug($request->input('name'));

        // 4. Save the data to the database
        Collection::create($validatedData);

        return redirect()->route('collection')->with('success', 'Collection created successfully!');
    }

    public function update(Request $request, $id)
    {
        $collection = Collection::findOrFail($id);
        $validatedData = $request->validate([
            'name' => 'required|string|max:255|unique:collections,name,' . $id,
            'collection_type' => 'required|string|max:50',
            'description' => 'nullable|string',
            'slug' => 'nullable|string|max:255|unique:collections,slug,' . $id,
            'parent_id' => 'nullable|exists:collections,id|not_in:' . $id, // Prevent self-reference
        ]);
        $validatedData['slug'] = Str::slug($validatedData['name']);
        // 2. Update the data in the database
        $collection->update($validatedData);

        return redirect()->route('collection')->with('success', 'Collection updated successfully!');
    }

    /**
     * Quick create collection for inline creation (WordPress-style)
     * Minimal fields: name and collection_type
     */
    public function quickCreate(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255|unique:collections,name',
            'collection_type' => 'required|string|in:category,tag,brand',
        ]);

        // Auto-generate slug from name
        $validatedData['slug'] = Str::slug($validatedData['name']);

        // Create the collection
        $collection = Collection::create($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Collection created successfully!',
            'collection' => [
                'id' => $collection->id,
                'name' => $collection->name,
                'slug' => $collection->slug,
                'collection_type' => $collection->collection_type,
            ]
        ], 201);
    }

    public function destroy($id)
    {
        Collection::findOrFail($id)->delete();
       return response()->json(['success' => 'Collection deleted successfully'], 200);
    }
}
