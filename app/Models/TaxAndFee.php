<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaxAndFee extends Model
{
    protected $fillable = [
        'name',
        'type',
        'rate',
        'is_percentage'
    ];
    
}
