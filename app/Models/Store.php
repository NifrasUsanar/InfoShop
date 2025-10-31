<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Userstamps;
use Illuminate\Support\Facades\Auth;

class Store extends Model
{
    use HasFactory;
    use SoftDeletes;
    use Userstamps;

    protected $fillable = [
        'name',
        'address',
        'contact_number',
        'sale_prefix',
        'current_sale_number',
    ];

    public function scopeForCurrentUser($query)
    {
        if (Auth::user()->user_role === 'admin' || Auth::user()->user_role === 'super-admin') {
            return $query;
        }

        return $query->where('id', Auth::user()->store_id);
    }
}
