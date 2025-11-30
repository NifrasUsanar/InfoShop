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
            ['meta_key' => 'shop_name', 'meta_value' => 'Info Shop'],
            ['meta_key' => 'shop_logo', 'meta_value' => 'oneshop-logo.png'],
            ['meta_key' => 'sale_receipt_note', 'meta_value' => 'Thank you'],
            ['meta_key' => 'sale_print_padding_right', 'meta_value' => '35'],
            ['meta_key' => 'sale_print_padding_left', 'meta_value' => '2'],
            ['meta_key' => 'sale_print_font', 'meta_value' => 'Arial, sans-serif'],
            ['meta_key' => 'auto_open_print_dialog', 'meta_value' => '0'],
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
            ['meta_key' => 'barcode_template', 'meta_value' => '<style>
                .barcode-container {
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    width: 40mm;
                }

                .store-name {
                    font-weight: bold;
                    z-index: 20;
                    font-size: 0.75rem;
                    margin: 3px 0;
                }

                .product-price {
                    font-weight: bold;
                    font-size: 0.8rem;
                    margin-top: -3px;
                    margin-bottom: -5px;
                }

                .barcode {
                    display: block;
                    margin-top: -10px;
                    width: 100%;
                }

                .product-name {
                    font-weight: bold;
                    margin-top: -4px;
                    font-size: 0.7rem;
                }

                .wrapper {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                svg#barcode-svg {
                    width: 100%;
                }

                .barcode-code {
                    font-size: 0.65rem;
                    font-weight: bold;
                    margin: 2px 0;
                }

                .divider {
                    border: none;
                    border-top: 1px solid black;
                    margin: 2px 0;
                    width: 100%;
                }
            </style>

            <div class="wrapper">
                <div class="barcode-container">
                    <p class="store-name">{{store_name}}</p>

                    <div class="barcode" style="width: 100%;">
                        <svg alt="Barcode" id="barcode-svg" style="width: 100%;"></svg>
                    </div>
                    <p class="product-name">{{product_name}}</p>

                    <hr class="divider" />

                    <p class="product-price">{{price}}</p>
                </div>
            </div>'],
            ['meta_key' => 'barcode_settings', 'meta_value' => json_encode([
                'format' => 'CODE128',
                'width' => 2,
                'height' => 35,
                'fontSize' => 14,
            ])],
        ];

        Setting::insert($settings);
    }
}
