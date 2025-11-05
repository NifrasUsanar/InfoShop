<?php

namespace Database\Seeders;
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
            'name' => 'INFO SHOP',
            'address'=>'Your business address',
            'contact_number'=>'00000001',
            'sale_prefix'=>'IS',
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
            'charges',
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
            'charges',
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
            'name' => 'Admin',
            'user_name'=>'master',
            'user_role'=>'super-admin',
            'email' => 'master@infomax.lk',
            'store_id' => 1,
            'password' => Hash::make('superadmin'),
        ]);
        $superAdmin->assignRole($superAdminRole);

        $admin=User::create([
            'name' => 'Admin',
            'user_name'=>'admin',
            'user_role'=>'admin',
            'email' => 'admin@infomax.lk',
            'store_id' => 1,
            'password' => Hash::make('admin'),
        ]);
        $admin->assignRole($adminRole);

        $this->call([
            ContactSeeder::class,
            SettingSeeder::class,
        ]);
    }
}
