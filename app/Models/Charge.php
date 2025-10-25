<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Charge extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'charge_type',
        'rate_value',
        'rate_type',
        'description',
        'is_active',
        'is_default',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'rate_value' => 'decimal:2',
    ];

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class, 'charge_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, $chargeType)
    {
        return $query->where('charge_type', $chargeType);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true)->where('is_active', true);
    }
}
