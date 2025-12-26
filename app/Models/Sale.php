<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Store;
use Illuminate\Support\Facades\DB;

class Sale extends Model
{
    use HasFactory;
    use SoftDeletes;
    
    protected $fillable = [
        'invoice_number',
        'sync_id',
        'reference_id',
        'sale_type',
        'store_id',        // Store ID
        'contact_id',     // Customer ID
        'sale_date',       // Sale date
        'total_amount',    //Net total (total after discount)
        'discount',        // Discount
        'amount_received',  // Amount received
        'profit_amount',   // Profit amount
        'status',          // Sale status ['completed', 'pending', 'refunded']
        'payment_status',
        'note',        // Note
        'created_by',
        'deleted_by',
        'cart_snapshot',
        'sale_time',
    ];

    protected static function boot()
    {
        parent::boot();

        static::created(function ($sale) {
            // Only generate invoice number if not already provided (e.g., from mobile/offline sales)
            if (empty($sale->invoice_number)) {
                DB::transaction(function () use ($sale) {
                    $store = Store::find($sale->store_id);
                    if ($store) {
                        $sale_number = $store->current_sale_number+1;
                        $year = $sale->sale_date instanceof \Carbon\Carbon
                            ? $sale->sale_date->year
                            : \Carbon\Carbon::parse($sale->sale_date)->year;
                        $padded_sale_id = str_pad($sale->id, 4, '0', STR_PAD_LEFT);
                        // Generate the invoice number based on the sale prefix and current sale number
                        $sale->invoice_number = $year.'/'.$padded_sale_id.'/'.str_pad($sale_number, 4, '0', STR_PAD_LEFT);

                        // Save the updated invoice number
                        $sale->save();

                        // Increment the current sale number in the store
                        $store->increment('current_sale_number');
                    }
                });
            }
        });
    }

    // public function getUpdatedAtAttribute($value)
    // {
    //     return \Carbon\Carbon::parse($value)->format('Y-m-d'); // Adjust the format as needed
    // }

    // // Accessor for formatted created_at date
    // public function getCreatedAtAttribute($value)
    // {
    //     return \Carbon\Carbon::parse($value)->format('Y-m-d'); // Adjust the format as needed
    // }

    // // Accessor for formatted sale_date date
    // public function getSaleDateAttribute($value)
    // {
    //     return \Carbon\Carbon::parse($value)->format('Y-m-d'); // Adjust the format as needed
    // }

    // Relationship to transactions
    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'sales_id');
    }

    // Relationship to sale items
    public function saleItems()
    {
        return $this->hasMany(SaleItem::class, 'sale_id');
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class, 'sale_id');
    }

    // Scope to filter sales by store_id
    public function scopeStoreId($query, $storeId)
    {
        if ($storeId !== 'All' && $storeId !== 0) {
            return $query->where('store_id', $storeId);
        }
        return $query;
    }

    
    // Scope to filter sales by start_date and end_date
    public function scopeDateFilter($query, $start_date, $end_date)
    {
        if (!empty($start_date) && !empty($end_date)) {
            return $query->whereBetween('sale_date', [$start_date, $end_date]);
        }
        return $query;
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }
}
