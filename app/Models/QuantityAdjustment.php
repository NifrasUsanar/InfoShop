<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuantityAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_id',
        'previous_quantity',
        'adjusted_quantity',
        'reason',
        'created_by',
        'stock_id',
    ];
}