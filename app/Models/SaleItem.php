<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Userstamps;

class SaleItem extends Model
{
    use HasFactory;
    use SoftDeletes;
    use Userstamps;

    protected $fillable = [
        'sale_id',          // Sale ID without foreign key constraint
        'product_id',       // Product ID without foreign key constraint
        'batch_id',         // Batch ID without foreign key constraint
        'quantity',         // Quantity sold
        'unit_price',       // Sale price per unit
        'unit_cost',        // Cost price per unit
        'discount',         // Discount applied to this item
        'sale_date',
        'description',
        'note',
        'is_free',
        'meta_data',
        'flat_discount',
        'free_quantity',
        'item_type',        // product or charge
        'charge_id',        // Reference to charges table
        'charge_type',      // tax, service_charge, delivery_fee, discount, gratuity, custom
        'rate_value',       // Percentage or fixed amount value
        'rate_type',        // percentage or fixed
        'base_amount',      // Amount this charge is calculated on
        'notes',            // Additional notes
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function charge()
    {
        return $this->belongsTo(Charge::class);
    }

    public function scopeDateFilter($query, $start_date, $end_date)
    {
        if (!empty($start_date) && !empty($end_date)) {
            return $query->whereBetween('sale_date', [$start_date, $end_date]);
        }
        return $query;
    }

    public function scopeStoreId($query, $storeId)
    {
        if ($storeId !== 'All' && $storeId !== 0) {
            return $query->where('store_id', $storeId);
        }
        return $query;
    }
}
