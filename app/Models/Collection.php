<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Collection extends Model
{
    use HasFactory;

    protected $fillable = [
        'collection_type',
        'name',
        'description',
        'parent_id',
        'slug',
    ];

    // Define relationships if necessary (self-referencing for hierarchical structure)
    public function parent()
    {
        return $this->belongsTo(Collection::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Collection::class, 'parent_id');
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'collection_product');
    }
}
