<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Contact;

class DemoContactSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            [
                'name'           => 'John Silva',
                'email'          => 'john.silva@example.com',
                'phone'          => '0771234567',
                'whatsapp'       => '0771234567',
                'address'        => '12 Galle Road, Colombo 03',
                'balance'        => 0,
                'loyalty_points' => 150,
                'type'           => 'customer',
            ],
            [
                'name'           => 'Mary Fernando',
                'email'          => 'mary.fernando@example.com',
                'phone'          => '0772345678',
                'whatsapp'       => '0772345678',
                'address'        => '45 Kandy Road, Kurunegala',
                'balance'        => -850.00,
                'loyalty_points' => 80,
                'type'           => 'customer',
            ],
            [
                'name'           => 'Ravi Kumar',
                'email'          => 'ravi.kumar@example.com',
                'phone'          => '0763456789',
                'whatsapp'       => null,
                'address'        => '78 Main Street, Jaffna',
                'balance'        => 500.00,
                'loyalty_points' => 320,
                'type'           => 'customer',
            ],
            [
                'name'           => 'Priya Patel',
                'email'          => 'priya.patel@example.com',
                'phone'          => '0774567890',
                'whatsapp'       => '0774567890',
                'address'        => '23 Temple Road, Matara',
                'balance'        => 0,
                'loyalty_points' => 50,
                'type'           => 'customer',
            ],
            [
                'name'           => 'Ahmed Hassan',
                'email'          => 'ahmed.hassan@example.com',
                'phone'          => '0775678901',
                'whatsapp'       => '0775678901',
                'address'        => '56 Beach Road, Batticaloa',
                'balance'        => -2400.00,
                'loyalty_points' => 420,
                'type'           => 'customer',
            ],
            [
                'name'           => 'Lisa Wong',
                'email'          => 'lisa.wong@example.com',
                'phone'          => '0116789012',
                'whatsapp'       => null,
                'address'        => '89 Flower Road, Colombo 07',
                'balance'        => 0,
                'loyalty_points' => 210,
                'type'           => 'customer',
            ],
            [
                'name'           => 'Tom Brown',
                'email'          => 'tom.brown@example.com',
                'phone'          => '0777890123',
                'whatsapp'       => '0777890123',
                'address'        => '34 Lake Road, Kandy',
                'balance'        => -650.00,
                'loyalty_points' => 90,
                'type'           => 'customer',
            ],
            [
                'name'           => 'Nilufar Rashid',
                'email'          => 'nilufar@example.com',
                'phone'          => '0778901234',
                'whatsapp'       => '0778901234',
                'address'        => '12 Park Avenue, Negombo',
                'balance'        => 1200.00,
                'loyalty_points' => 560,
                'type'           => 'customer',
            ],
        ];

        foreach ($customers as $customer) {
            Contact::create($customer);
        }

        $vendors = [
            [
                'name'    => 'Tech Supplies Co',
                'email'   => 'info@techsupplies.lk',
                'phone'   => '0112345678',
                'address' => '100 Industrial Zone, Biyagama',
                'balance' => -15000.00,
                'type'    => 'vendor',
            ],
            [
                'name'    => 'Fresh Foods Ltd',
                'email'   => 'orders@freshfoods.lk',
                'phone'   => '0113456789',
                'address' => '55 Market Road, Dambulla',
                'balance' => -8500.00,
                'type'    => 'vendor',
            ],
            [
                'name'    => 'Garment World',
                'email'   => 'sales@garmentworld.lk',
                'phone'   => '0114567890',
                'address' => '22 Free Trade Zone, Katunayake',
                'balance' => 0,
                'type'    => 'vendor',
            ],
            [
                'name'    => 'Office Essentials',
                'email'   => 'supply@officeessentials.lk',
                'phone'   => '0115678901',
                'address' => '77 Nawala Road, Rajagiriya',
                'balance' => -3200.00,
                'type'    => 'vendor',
            ],
        ];

        foreach ($vendors as $vendor) {
            Contact::create($vendor);
        }
    }
}
