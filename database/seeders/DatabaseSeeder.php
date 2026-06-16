<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Store;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Reset Spatie permission cache before seeding so stale data doesn't interfere
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ── Store ────────────────────────────────────────────────────────────
        Store::create([
            'name'                => 'InfoShop Demo',
            'address'             => '42 Galle Road, Colombo 03, Sri Lanka',
            'contact_number'      => '0112345678',
            'sale_prefix'         => 'IS',
            'current_sale_number' => 0,
        ]);

        // ── Permissions ──────────────────────────────────────────────────────
        $permissions = [
            'pos', 'products', 'inventory', 'sales', 'customers', 'vendors',
            'charges', 'collections', 'expenses', 'quotations', 'reloads',
            'cheques', 'sold-items', 'purchases', 'payments', 'stores',
            'employees', 'payroll', 'media', 'settings',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // ── Roles with explicit guard ─────────────────────────────────────────
        $superAdminRole = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);
        $adminRole      = Role::firstOrCreate(['name' => 'admin',       'guard_name' => 'web']);
        $userRole       = Role::firstOrCreate(['name' => 'user',        'guard_name' => 'web']);

        // Reset cache again after creating roles/permissions so assignments work fresh
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $superAdminRole->syncPermissions(Permission::all());
        $adminRole->syncPermissions($permissions);
        $userRole->syncPermissions(['products', 'pos']);

        // ── Users ─────────────────────────────────────────────────────────────
        // Both user_role (display/filter column) and Spatie assignRole() must be set
        $superAdmin = User::create([
            'name'      => 'Super Admin',
            'user_name' => 'superadmin',
            'user_role' => 'super-admin',   // display column
            'email'     => 'superadmin@demo.com',
            'store_id'  => 1,
            'password'  => Hash::make('superadmin'),
            'is_active' => true,
        ]);
        $superAdmin->assignRole($superAdminRole); // Spatie model_has_roles

        $admin = User::create([
            'name'      => 'Admin User',
            'user_name' => 'admin',
            'user_role' => 'admin',
            'email'     => 'admin@demo.com',
            'store_id'  => 1,
            'password'  => Hash::make('admin123'),
            'is_active' => true,
        ]);
        $admin->assignRole($adminRole);

        $cashier = User::create([
            'name'      => 'Cashier',
            'user_name' => 'cashier',
            'user_role' => 'user',
            'email'     => 'cashier@demo.com',
            'store_id'  => 1,
            'password'  => Hash::make('cashier123'),
            'is_active' => true,
        ]);
        $cashier->assignRole($userRole);

        // Final cache reset so the app sees all roles/permissions immediately
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ── Core seeders (required for app to work) ───────────────────────────
        $this->call([
            ContactSeeder::class,   // Guest contact (ID=1)
            SettingSeeder::class,   // App settings
        ]);

        // ── Demo data ─────────────────────────────────────────────────────────
        $this->call([
            CollectionSeeder::class,
            ChargeSeeder::class,
            DemoContactSeeder::class,
            DemoProductSeeder::class,
            DemoEmployeeSeeder::class,
            DemoPurchaseSeeder::class,
            DemoSaleSeeder::class,
            DemoExpenseSeeder::class,
            DemoChequeSeeder::class,
        ]);

        $this->command->info('');
        $this->command->info('Demo seeding complete!');
        $this->command->info('');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Super Admin', 'superadmin@demo.com', 'superadmin'],
                ['Admin',       'admin@demo.com',       'admin123'],
                ['Cashier',     'cashier@demo.com',     'cashier123'],
            ]
        );
    }
}
