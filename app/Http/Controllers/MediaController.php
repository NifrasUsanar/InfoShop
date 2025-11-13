<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use App\Models\Product;
use App\Models\Attachment;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MediaController extends Controller
{
    public function index()
    {
        // $basePath = storage_path('app/public/uploads'); // Base directory path

        // function getAllFilesAsUrls($path)
        // {
        //     $files = File::files($path); // Get files in the current directory
        //     $allFiles = array_map(function ($file) {
        //         return [
        //             'url' => asset(str_replace(storage_path('app/public'), 'storage', $file->getPathname())), // File URL
        //             'name' => $file->getFilename(), // File name
        //             'size' => round($file->getSize() / 1024, 2) . ' KB', // File size in KB
        //             'date' => date('Y-m-d H:i:s', $file->getMTime()),
        //         ];
        //     }, $files);

        //     // Get subdirectories
        //     $subdirectories = File::directories($path);

        //     // Loop through subdirectories recursively
        //     foreach ($subdirectories as $subdirectory) {
        //         $allFiles = array_merge($allFiles, getAllFilesAsUrls($subdirectory));
        //     }

        //     return $allFiles;
        // }
        // $images = getAllFilesAsUrls($basePath);

        $attachments = Attachment::where('attachment_type', 'image')->get()->map(function ($attachment) {
            // Use Storage::url() to get proper storage URL with symlink support
            $attachment->path = Storage::url($attachment->path);

            // Convert size from bytes to KB
            $attachment->size = round($attachment->size / 1024, 2) . 'KB'; // Converts bytes to KB and rounds to 2 decimal places

            return $attachment;
        });

        $settings = Setting::where('meta_key', 'misc_settings')->pluck('meta_value', 'meta_key')->first();
        // Pass the data to the view
        return Inertia::render('Media/Media', [
            'images' => $attachments, // Structure: ['directoryName' => ['file1', 'file2', ...]]
            'pageLabel' => 'Media Library',
            'settings' => $settings,
        ]);
    }

    public function migrateImages()
    {
        // Step 1: Retrieve all products where image_url is not null
        $products = Product::whereNotNull('image_url')
            ->whereNull('attachment_id')
            ->get();

        DB::beginTransaction();

        try {

            // Step 2: Loop through each product
            foreach ($products as $product) {
                // Check if the image_url is valid and file exists
                if ($product->image_url && Storage::disk('public')->exists($product->image_url)) {
                    // Step 3: Store the image into the attachments table
                    // Here, we're assuming the image is already stored and its URL is available
                    $attachment = Attachment::create([
                        'path' => $product->image_url, // Assuming the image is already stored on public disk
                        'file_name' => $product->name, // Extract file name from URL
                        'attachment_type' => 'image', // Get MIME type
                        'size' => Storage::disk('public')->size($product->image_url), // Get file size
                        'type' => 'image', // Type of attachment
                    ]);

                    // Step 4: Update the product with the new attachment_id
                    $product->update([
                        'attachment_id' => $attachment->id, // Associate with the new attachment ID
                    ]);

                    // Optionally, you can log the migration status
                    // Log::info("Product ID {$product->id} updated with attachment ID {$attachment->id}");
                }
            }
            DB::commit();

            return 'Migration of product images completed successfully!';
        } catch (\Exception $e) {
            // If an error occurs, roll back the transaction
            DB::rollBack();

            // Optionally, log the error
            Log::error("Migration failed: " . $e->getMessage());

            // Return error response
            return $e->getMessage();
        }
    }

    public function optimizeImages(Request $request)
    {
        // Validate the incoming request
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048', // Limit image size (2MB)
            'original_image' => 'required|string', // URL of the image
        ]);

        // Get the image from the request
        $image = $request->file('image');
        $imageUrl = $request->input('original_image');
        $attachmentId = $request->input('attachment_id');

        // Get the attachment based on the ID
        $attachment = Attachment::find($attachmentId);
        if (!$attachment) {
            return response()->json(['error' => 'Attachment not found'], 404);
        }

        $relativePath = parse_url($imageUrl, PHP_URL_PATH);
        // dd($relativePath);
        $relativePath = str_replace('/storage/', '', $relativePath);
        $storagePath = storage_path('app/public/' . $relativePath);

        // Check if file exists at that location
        if (!file_exists($storagePath)) {
            return response()->json(['error' => 'Image not found at the specified location'], 404);
        }

        // Move the uploaded image to the target location
        $image->move(dirname($storagePath), basename($storagePath));

        $fileSize = File::size($storagePath);
        $attachment->size = $fileSize;  // Update the size in KB
        $attachment->save();

        return response()->json(['success' => 'Image uploaded and replaced successfully'], 200);
    }
}
