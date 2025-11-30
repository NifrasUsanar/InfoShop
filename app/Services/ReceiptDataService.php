<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ReceiptDataService
{
    /**
     * Get receipt data for a given sale ID
     * Returns a structured array with sale, salesItems, settings, and user_name
     *
     * @param int $saleId
     * @return array
     */
    public static function getReceiptData($saleId)
    {
        $imageUrl = '';
        if (app()->environment('production')) {
            $imageUrl = 'public/';
        }

        // Fetch all settings
        $settings = Setting::all();
        $settingArray = $settings->pluck('meta_value', 'meta_key')->all();
        $settingArray['shop_logo'] = $imageUrl . $settingArray['shop_logo'];

        // Fetch sale with joins
        $sale = Sale::select(
            'sales.id',
            'contact_id',
            'sale_date',
            'total_amount',
            'total_charge_amount',
            'discount',
            'amount_received',
            'status',
            'stores.address',
            'contacts.name',
            'contacts.whatsapp',
            'sales.created_by',
            'invoice_number',
            'stores.sale_prefix',
            'stores.contact_number',
            'sales.created_at'
        )
            ->leftJoin('contacts', 'sales.contact_id', '=', 'contacts.id')
            ->join('stores', 'sales.store_id', '=', 'stores.id')
            ->where('sales.id', $saleId)
            ->first();

        // Fetch sale items with joins
        $salesItems = SaleItem::select(
            'sale_items.quantity',
            'sale_items.unit_price',
            'sale_items.discount',
            'sale_items.flat_discount',
            'sale_items.free_quantity',
            'sale_items.charge_id',
            'sale_items.item_type',
            'sale_items.description',
            'sale_items.charge_type',
            'sale_items.rate_value',
            'sale_items.rate_type',
            'products.name',
            DB::raw("CASE
                WHEN products.product_type = 'reload'
                THEN reload_and_bill_metas.account_number
                ELSE NULL
             END as account_number")
        )
            ->leftJoin('products', 'sale_items.product_id', '=', 'products.id')
            ->leftJoin('reload_and_bill_metas', function ($join) {
                $join->on('sale_items.id', '=', 'reload_and_bill_metas.sale_item_id')
                    ->where('products.product_type', '=', 'reload');
            })
            ->where('sale_items.sale_id', $saleId)
            ->get();

        // Fetch user name
        $user = User::find($sale->created_by);

        return [
            'sale' => $sale,
            'salesItems' => $salesItems,
            'settings' => $settingArray,
            'user_name' => $user->name ?? 'Unknown',
        ];
    }
}
