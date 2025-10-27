<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Dashboard
            ['group' => 'dashboard', 'name' => 'view_dashboard', 'title' => 'View Dashboard', 'guard_name' => 'web'],

            // POS
            ['group' => 'pos', 'name' => 'pos', 'title' => 'View POS', 'guard_name' => 'web'],

            // Sales
            ['group' => 'sales', 'name' => 'sales', 'title' => 'View Sales', 'guard_name' => 'web'],
            ['group' => 'sales', 'name' => 'create_sales', 'title' => 'Create Sales', 'guard_name' => 'web'],
            ['group' => 'sales', 'name' => 'edit_sales', 'title' => 'Edit Sales', 'guard_name' => 'web'],
            ['group' => 'sales', 'name' => 'delete_sales', 'title' => 'Delete Sales', 'guard_name' => 'web'],

            // Purchases
            ['group' => 'purchases', 'name' => 'purchases', 'title' => 'View Purchases', 'guard_name' => 'web'],
            ['group' => 'purchases', 'name' => 'create_purchases', 'title' => 'Create Purchases', 'guard_name' => 'web'],
            ['group' => 'purchases', 'name' => 'edit_purchases', 'title' => 'Edit Purchases', 'guard_name' => 'web'],
            ['group' => 'purchases', 'name' => 'delete_purchases', 'title' => 'Delete Purchases', 'guard_name' => 'web'],

            // Products
            ['group' => 'products', 'name' => 'products', 'title' => 'View Products', 'guard_name' => 'web'],
            ['group' => 'products', 'name' => 'create_products', 'title' => 'Create Products', 'guard_name' => 'web'],
            ['group' => 'products', 'name' => 'edit_products', 'title' => 'Edit Products', 'guard_name' => 'web'],
            ['group' => 'products', 'name' => 'delete_products', 'title' => 'Delete Products', 'guard_name' => 'web'],

            // Charges
            ['group' => 'charges', 'name' => 'charges', 'title' => 'View Charges', 'guard_name' => 'web'],
            ['group' => 'charges', 'name' => 'create_charges', 'title' => 'Create Charges', 'guard_name' => 'web'],
            ['group' => 'charges', 'name' => 'edit_charges', 'title' => 'Edit Charges', 'guard_name' => 'web'],
            ['group' => 'charges', 'name' => 'delete_charges', 'title' => 'Delete Charges', 'guard_name' => 'web'],

            // Payments
            ['group' => 'payments', 'name' => 'payments', 'title' => 'View Payments', 'guard_name' => 'web'],
            ['group' => 'payments', 'name' => 'create_payments', 'title' => 'Create Payments', 'guard_name' => 'web'],
            ['group' => 'payments', 'name' => 'delete_payments', 'title' => 'Delete Payments', 'guard_name' => 'web'],

            // Reports
            ['group' => 'reports', 'name' => 'reports', 'title' => 'View Reports', 'guard_name' => 'web'],

            // Inventory
            ['group' => 'inventory', 'name' => 'inventory', 'title' => 'View Inventory', 'guard_name' => 'web'],
            ['group' => 'inventory', 'name' => 'adjust_inventory', 'title' => 'Adjust Inventory', 'guard_name' => 'web'],

            // Collections
            ['group' => 'collections', 'name' => 'collections', 'title' => 'View Collections', 'guard_name' => 'web'],
            ['group' => 'collections', 'name' => 'create_collections', 'title' => 'Create Collections', 'guard_name' => 'web'],
            ['group' => 'collections', 'name' => 'edit_collections', 'title' => 'Edit Collections', 'guard_name' => 'web'],
            ['group' => 'collections', 'name' => 'delete_collections', 'title' => 'Delete Collections', 'guard_name' => 'web'],

            // Expenses
            ['group' => 'expenses', 'name' => 'expenses', 'title' => 'View Expenses', 'guard_name' => 'web'],
            ['group' => 'expenses', 'name' => 'create_expenses', 'title' => 'Create Expenses', 'guard_name' => 'web'],
            ['group' => 'expenses', 'name' => 'edit_expenses', 'title' => 'Edit Expenses', 'guard_name' => 'web'],
            ['group' => 'expenses', 'name' => 'delete_expenses', 'title' => 'Delete Expenses', 'guard_name' => 'web'],

            // Customers
            ['group' => 'customers', 'name' => 'customers', 'title' => 'View Customers', 'guard_name' => 'web'],
            ['group' => 'customers', 'name' => 'create_customers', 'title' => 'Create Customers', 'guard_name' => 'web'],
            ['group' => 'customers', 'name' => 'edit_customers', 'title' => 'Edit Customers', 'guard_name' => 'web'],
            ['group' => 'customers', 'name' => 'delete_customers', 'title' => 'Delete Customers', 'guard_name' => 'web'],

            // Vendors
            ['group' => 'vendors', 'name' => 'vendors', 'title' => 'View Suppliers', 'guard_name' => 'web'],
            ['group' => 'vendors', 'name' => 'create_vendors', 'title' => 'Create Suppliers', 'guard_name' => 'web'],
            ['group' => 'vendors', 'name' => 'edit_vendors', 'title' => 'Edit Suppliers', 'guard_name' => 'web'],
            ['group' => 'vendors', 'name' => 'delete_vendors', 'title' => 'Delete Suppliers', 'guard_name' => 'web'],

            // Stores
            ['group' => 'stores', 'name' => 'stores', 'title' => 'View Stores', 'guard_name' => 'web'],
            ['group' => 'stores', 'name' => 'create_stores', 'title' => 'Create Stores', 'guard_name' => 'web'],
            ['group' => 'stores', 'name' => 'edit_stores', 'title' => 'Edit Stores', 'guard_name' => 'web'],
            ['group' => 'stores', 'name' => 'delete_stores', 'title' => 'Delete Stores', 'guard_name' => 'web'],

            // Employees & Payroll
            ['group' => 'employees', 'name' => 'employees', 'title' => 'View Employees', 'guard_name' => 'web'],
            ['group' => 'employees', 'name' => 'create_employees', 'title' => 'Create Employees', 'guard_name' => 'web'],
            ['group' => 'employees', 'name' => 'edit_employees', 'title' => 'Edit Employees', 'guard_name' => 'web'],
            ['group' => 'employees', 'name' => 'delete_employees', 'title' => 'Delete Employees', 'guard_name' => 'web'],
            ['group' => 'payroll', 'name' => 'view_payroll', 'title' => 'View Payroll', 'guard_name' => 'web'],

            // Media
            ['group' => 'media', 'name' => 'media', 'title' => 'View Media', 'guard_name' => 'web'],
            ['group' => 'media', 'name' => 'upload_media', 'title' => 'Upload Media', 'guard_name' => 'web'],

            // Settings
            ['group' => 'settings', 'name' => 'settings', 'title' => 'View Settings', 'guard_name' => 'web'],
            ['group' => 'settings', 'name' => 'update_settings', 'title' => 'Update Settings', 'guard_name' => 'web'],

            // Users & Roles
            ['group' => 'users', 'name' => 'users', 'title' => 'View Users', 'guard_name' => 'web'],
            ['group' => 'users', 'name' => 'create_users', 'title' => 'Create Users', 'guard_name' => 'web'],
            ['group' => 'users', 'name' => 'edit_users', 'title' => 'Edit Users', 'guard_name' => 'web'],
            ['group' => 'users', 'name' => 'delete_users', 'title' => 'Delete Users', 'guard_name' => 'web'],
            ['group' => 'roles', 'name' => 'view_roles', 'title' => 'View Roles', 'guard_name' => 'web'],
            ['group' => 'roles', 'name' => 'manage_roles', 'title' => 'Manage Roles', 'guard_name' => 'web'],

            
            ['group' => 'quotations', 'name' => 'quotations', 'title' => 'View Quotations', 'guard_name' => 'web'],
            ['group' => 'soldItems', 'name' => 'sold_items', 'title' => 'View Sold Items', 'guard_name' => 'web'],
        ];

        try {
            DB::beginTransaction();

            foreach ($permissions as $permission) {
                Permission::updateOrCreate(
                    ['name' => $permission['name'], 'group'=> $permission['group']],
                    [     
                        'title'      => $permission['title'],
                        'guard_name' => $permission['guard_name'] ?? 'web',
                    ]
                );
            }

            $admin = Role::firstOrCreate(['name' => 'admin']);
            $admin->syncPermissions(Permission::all());
           Log::info('Admin role permissions:', $admin->permissions->pluck('name')->toArray());

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Permission seeding failed: ' . $e->getMessage());
        }
    }
}
