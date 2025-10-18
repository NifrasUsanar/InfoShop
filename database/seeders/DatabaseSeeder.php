<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Support\Facades\Hash;

use App\Models\User;
use App\Models\Store;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        Store::create([
            'name' => 'Afnan shop ',
            'address'=>'Asad Petrol pump Mandew',
            'contact_number'=>'03329667974',
            'sale_prefix'=>'AF-',
            'current_sale_number'=>0,
        ]);

        $superAdminRole = Role::firstOrCreate(['name' => 'super-admin']);
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $userRole = Role::firstOrCreate(['name' => 'user']);

        $permissions = [
            'pos',
            'products',
            'inventory',
            'sales',
            'customers',
            'vendors',
            'collections',
            'expenses',
            'quotations',
            'reloads',
            'cheques',
            'sold-items',
            'purchases',
            'payments',
            'stores',
            'employees',
            'payroll',
            'media',
            'settings',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }
        $superAdminRole->givePermissionTo(Permission::all());

        $adminPermissions = [
            'pos',
            'products',
            'inventory',
            'sales',
            'customers',
            'vendors',
            'collections',
            'expenses',
            'quotations',
            'reloads',
            'cheques',
            'sold-items',
            'purchases',
            'payments',
            'stores',
            'employees',
            'payroll',
            'media',
            'settings',
        ];
        $adminRole->givePermissionTo($adminPermissions);

        $userPermissions = [
            'products',
            'pos'
        ];
        $userRole->givePermissionTo($userPermissions);
        
        $superAdmin=User::create([
            'name' => 'Afnan Khan super admin',
            'user_name'=>'afnan_super_admin',
            'user_role'=>'super-admin',
            'email' => 'super_admin@gmail.com',
            'store_id' => 1,
            'password' => Hash::make('12345678'),
        ]);
        $superAdmin->assignRole($superAdminRole);

        $admin=User::create([
            'name' => 'Afnan Khan admin',
            'user_name'=>'afnan_admin',
            'user_role'=>'admin',
            'email' => 'admin@gmail.com',
            'store_id' => 1,
            'password' => Hash::make('12345678'),
        ]);
        $admin->assignRole($adminRole);

        $this->call([
            ContactSeeder::class,
            SettingSeeder::class,
            ProductSeeder::class,
        ]);
    }
}
