<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Charge;

class ChargeSeeder extends Seeder
{
    public function run(): void
    {
        $charges = [
            [
                'name'        => 'VAT',
                'charge_type' => 'tax',
                'rate_value'  => 10.00,
                'rate_type'   => 'percentage',
                'description' => 'Value Added Tax (10%)',
                'is_active'   => true,
                'is_default'  => true,
            ],
            [
                'name'        => 'Service Charge',
                'charge_type' => 'service_charge',
                'rate_value'  => 5.00,
                'rate_type'   => 'percentage',
                'description' => 'Service charge (5%)',
                'is_active'   => true,
                'is_default'  => false,
            ],
            [
                'name'        => 'Delivery Fee',
                'charge_type' => 'delivery_fee',
                'rate_value'  => 300.00,
                'rate_type'   => 'fixed',
                'description' => 'Standard delivery fee',
                'is_active'   => true,
                'is_default'  => false,
            ],
        ];

        foreach ($charges as $charge) {
            Charge::create($charge);
        }
    }
}
