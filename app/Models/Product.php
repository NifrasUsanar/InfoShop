<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Userstamps;

class Product extends Model
{
    use HasFactory;
    use SoftDeletes;
    use Userstamps;
    
    protected $fillable = [
        'name',
        'description',
        'sku',
        'barcode',
        'image_url',
        'unit',
        'quantity',
        'alert_quantity',
        'is_stock_managed',
        'is_active',
        'brand_id',
        'category_id',
        'discount',
        'is_featured',
        'product_type',
        'meta_data',
        'attachment_id',
    ];

    protected $casts = [
        'meta_data' => 'array', // Ensure the meta_data column is treated as an array
    ];

    public function batches()
    {
        return $this->hasMany(ProductBatch::class, 'product_id');
    }

    public function stocks()
    {
        return $this->hasMany(ProductStock::class, 'product_id');
    }

    public function collections()
    {
        return $this->belongsToMany(Collection::class, 'collection_product');
    }
}
