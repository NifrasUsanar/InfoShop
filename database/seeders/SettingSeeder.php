<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Setting;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            ['meta_key' => 'shop_name', 'meta_value' => 'Afnan shop'],
            ['meta_key' => 'shop_address', 'meta_value' => 'Asad Petrol pump Mandew'],
            ['meta_key' => 'shop_contact', 'meta_value' => '03329667974'],
            ['meta_key' => 'shop_logo', 'meta_value' => 'afnan-logo.png'],
            ['meta_key' => 'sale_receipt_note', 'meta_value' => 'Thank you'],
            ['meta_key' => 'sale_print_padding_right', 'meta_value' => '35'],
            ['meta_key' => 'sale_print_padding_left', 'meta_value' => '2'],
            ['meta_key' => 'sale_print_font', 'meta_value' => 'Arial, sans-serif'],
            ['meta_key' => 'show_barcode_store', 'meta_value' => 'on'],
            ['meta_key' => 'show_barcode_product_price', 'meta_value' => 'on'],
            ['meta_key' => 'show_barcode_product_name', 'meta_value' => 'on'],
            ['meta_key' => 'product_code_increment', 'meta_value' => '1000'],
            ['meta_key' => 'modules', 'meta_value' => 'Cheques'],
            ['meta_key' => 'misc_settings', 'meta_value' => json_encode([
                'optimize_image_size' => '0.5',
                'optimize_image_width' => '400',
                'cheque_alert' => '2',
                'product_alert' => '1',
            ])],
        ];

        Setting::insert($settings);
    }
}
