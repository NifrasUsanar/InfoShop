<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('activity_log', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('log_name')->nullable()->index();
            $table->text('description');
            $table->string('subject_type')->nullable();
            $table->string('event')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('causer_type')->nullable();
            $table->unsignedBigInteger('causer_id')->nullable();
            $table->json('properties')->nullable();
            $table->char('batch_uuid', 36)->nullable();
            $table->timestamps();

            $table->index(['causer_type', 'causer_id'], 'causer');
            $table->index(['subject_type', 'subject_id'], 'subject');
        });

        Schema::create('attachments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('path');
            $table->string('file_name')->nullable();
            $table->string('attachment_type')->nullable();
            $table->unsignedBigInteger('size')->nullable();
            $table->string('alt_text')->nullable();
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('authentication_log', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('authenticatable_type');
            $table->unsignedBigInteger('authenticatable_id');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('login_at')->nullable();
            $table->boolean('login_successful')->default(false);
            $table->timestamp('logout_at')->nullable();
            $table->boolean('cleared_by_user')->default(false);
            $table->json('location')->nullable();

            $table->index(['authenticatable_type', 'authenticatable_id']);
        });

        Schema::create('cache', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });

        Schema::create('cash_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->date('transaction_date');
            $table->enum('transaction_type', ['cash_in', 'cash_out']);
            $table->decimal('amount', 10);
            $table->enum('source', ['sales', 'purchases', 'expenses', 'deposit', 'withdrawal', 'other', 'salary']);
            $table->string('description')->nullable();
            $table->unsignedBigInteger('store_id')->index('cash_logs_store_id_foreign');
            $table->unsignedBigInteger('contact_id')->nullable()->index('cash_logs_contact_id_foreign');
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable()->index('cash_logs_created_by_foreign');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('cheques', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('cheque_number');
            $table->date('cheque_date');
            $table->string('name');
            $table->decimal('amount', 15);
            $table->date('issued_date');
            $table->string('bank')->nullable();
            $table->string('status');
            $table->text('remark')->nullable();
            $table->enum('direction', ['issued', 'received']);
            $table->unsignedBigInteger('store_id')->index('cheques_store_id_foreign');
            $table->unsignedBigInteger('created_by')->index('cheques_created_by_foreign');
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('collections', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('collection_type', 50);
            $table->string('name', 100)->unique();
            $table->string('slug', 100)->unique();
            $table->text('description')->nullable();
            $table->integer('parent_id')->nullable();
            $table->timestamps();
        });

        Schema::create('contacts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('address')->nullable();
            $table->decimal('balance', 10)->default(0);
            $table->decimal('loyalty_points', 10)->nullable();
            $table->decimal('loyalty_points_balance')->default(0);
            $table->enum('type', ['customer', 'vendor']);
            $table->integer('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('employee_balance_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('employee_id')->index('employee_balance_logs_employee_id_foreign');
            $table->unsignedBigInteger('store_id')->index('employee_balance_logs_store_id_foreign');
            $table->date('log_date')->nullable();
            $table->decimal('amount', 15);
            $table->string('description')->nullable();
            $table->unsignedBigInteger('created_by')->nullable()->index('employee_balance_logs_created_by_foreign');
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('employees', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('store_id')->index('employees_store_id_foreign');
            $table->string('name');
            $table->string('contact_number')->nullable();
            $table->text('address')->nullable();
            $table->date('joined_at');
            $table->decimal('salary', 10);
            $table->string('salary_frequency');
            $table->string('role');
            $table->string('status');
            $table->string('gender');
            $table->decimal('balance', 10)->default(0);
            $table->unsignedBigInteger('created_by')->nullable()->index('employees_created_by_foreign');
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('store_id')->index('expenses_store_id_foreign');
            $table->string('description');
            $table->decimal('amount', 10);
            $table->date('expense_date');
            $table->string('source')->nullable();
            $table->integer('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('failed_jobs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('uuid')->unique();
            $table->text('connection');
            $table->text('queue');
            $table->longText('payload');
            $table->longText('exception');
            $table->timestamp('failed_at')->useCurrent();
        });

        Schema::create('job_batches', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('total_jobs');
            $table->integer('pending_jobs');
            $table->integer('failed_jobs');
            $table->longText('failed_job_ids');
            $table->mediumText('options')->nullable();
            $table->integer('cancelled_at')->nullable();
            $table->integer('created_at');
            $table->integer('finished_at')->nullable();
        });

        Schema::create('jobs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('queue')->index();
            $table->longText('payload');
            $table->unsignedTinyInteger('attempts');
            $table->unsignedInteger('reserved_at')->nullable();
            $table->unsignedInteger('available_at');
            $table->unsignedInteger('created_at');
        });

        Schema::create('loyalty_point_transactions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('contact_id')->index('loyalty_point_transactions_contact_id_foreign');
            $table->unsignedBigInteger('store_id')->index('loyalty_point_transactions_store_id_foreign');
            $table->decimal('points');
            $table->enum('type', ['earn', 'redeem', 'expire', 'manual_adjustment']);
            $table->string('description')->nullable();
            $table->dateTime('expires_at')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('model_has_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('permission_id');
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');

            $table->index(['model_id', 'model_type']);
            $table->primary(['permission_id', 'model_id', 'model_type']);
        });

        Schema::create('model_has_roles', function (Blueprint $table) {
            $table->unsignedBigInteger('role_id');
            $table->string('model_type');
            $table->unsignedBigInteger('model_id');

            $table->index(['model_id', 'model_type']);
            $table->primary(['role_id', 'model_id', 'model_type']);
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('guard_name');
            $table->timestamps();

            $table->unique(['name', 'guard_name']);
        });

        Schema::create('product_batches', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('product_id')->index('product_batches_product_id_foreign');
            $table->unsignedBigInteger('contact_id')->nullable()->index('product_batches_contact_id_foreign');
            $table->string('batch_number')->default('DEFAULT');
            $table->date('expiry_date')->nullable();
            $table->decimal('cost', 10);
            $table->decimal('price', 10);
            $table->decimal('discount', 10)->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->integer('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('product_stocks', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('store_id')->index('product_stocks_store_id_foreign');
            $table->unsignedBigInteger('product_id')->nullable()->index('product_stocks_product_id_foreign');
            $table->unsignedBigInteger('batch_id')->index('product_stocks_batch_id_foreign');
            $table->decimal('quantity', 10)->default(0);
            $table->integer('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('sku', 100)->nullable()->unique();
            $table->string('barcode', 100)->nullable()->unique();
            $table->string('image_url')->nullable();
            $table->unsignedBigInteger('attachment_id')->nullable()->index('products_attachment_id_foreign');
            $table->string('unit', 10);
            $table->integer('brand_id')->nullable();
            $table->integer('category_id')->nullable();
            $table->string('product_type', 50)->nullable()->default('simple');
            $table->decimal('discount', 10)->default(0);
            $table->decimal('quantity', 10)->default(0);
            $table->decimal('alert_quantity', 10)->default(5);
            $table->boolean('is_stock_managed')->default(true);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->json('meta_data')->nullable();
            $table->integer('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('purchase_items', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('purchase_id')->index('purchase_items_purchase_id_foreign');
            $table->unsignedBigInteger('product_id')->nullable()->index('purchase_items_product_id_foreign');
            $table->unsignedBigInteger('batch_id')->nullable()->index('purchase_items_batch_id_foreign');
            $table->string('description')->nullable();
            $table->date('purchase_date');
            $table->decimal('quantity', 10);
            $table->decimal('unit_price', 10);
            $table->decimal('unit_cost', 10);
            $table->decimal('discount', 10)->default(0);
            $table->unsignedBigInteger('created_by')->nullable()->index('purchase_items_created_by_foreign');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('purchase_transactions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->unsignedBigInteger('store_id')->index('purchase_transactions_store_id_foreign');
            $table->unsignedBigInteger('purchase_id')->nullable()->index('purchase_transactions_purchase_id_foreign');
            $table->unsignedBigInteger('contact_id')->index('purchase_transactions_contact_id_foreign');
            $table->date('transaction_date');
            $table->decimal('amount', 10);
            $table->string('payment_method');
            $table->string('transaction_type');
            $table->string('note')->nullable();
            $table->integer('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('purchases', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('store_id')->index('purchases_store_id_foreign');
            $table->unsignedBigInteger('contact_id')->index('purchases_contact_id_foreign');
            $table->date('purchase_date');
            $table->string('reference_no');
            $table->decimal('total_amount', 10);
            $table->decimal('discount', 10)->default(0);
            $table->decimal('profit_amount', 10)->nullable()->default(0);
            $table->decimal('amount_paid', 10);
            $table->string('payment_status');
            $table->string('status');
            $table->text('note')->nullable();
            $table->integer('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('quantity_adjustments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('batch_id')->index('quantity_adjustments_batch_id_foreign');
            $table->unsignedBigInteger('stock_id')->index('quantity_adjustments_stock_id_foreign');
            $table->integer('previous_quantity');
            $table->integer('adjusted_quantity');
            $table->string('reason')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
        });

        Schema::create('quotation_items', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('quotation_id');
            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('batch_id')->nullable();
            $table->string('custom_description')->nullable();
            $table->decimal('price', 10);
            $table->decimal('discount')->nullable();
            $table->decimal('quantity', 10);
            $table->decimal('cost', 10)->nullable();
            $table->decimal('total', 10);
            $table->timestamps();
        });

        Schema::create('quotations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('store_id')->nullable();
            $table->unsignedBigInteger('contact_id');
            $table->string('quotation_number')->unique();
            $table->date('quotation_date');
            $table->date('expiry_date')->nullable();
            $table->string('quotation_terms')->nullable();
            $table->string('subject')->nullable();
            $table->decimal('subtotal', 10);
            $table->decimal('discount', 10)->default(0);
            $table->decimal('total', 10);
            $table->decimal('profit', 10)->default(0);
            $table->text('customer_notes')->nullable();
            $table->text('terms_conditions')->nullable();
            $table->json('custom_fields')->nullable();
            $table->integer('created_by')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('reload_and_bill_metas', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('sale_item_id')->index('reload_and_bill_metas_sale_item_id_foreign');
            $table->string('transaction_type');
            $table->string('account_number');
            $table->decimal('commission', 10)->default(0);
            $table->decimal('additional_commission', 10)->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('role_has_permissions', function (Blueprint $table) {
            $table->unsignedBigInteger('permission_id');
            $table->unsignedBigInteger('role_id')->index('role_has_permissions_role_id_foreign');

            $table->primary(['permission_id', 'role_id']);
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('guard_name');
            $table->timestamps();

            $table->unique(['name', 'guard_name']);
        });

        Schema::create('salary_adjustments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('employee_id')->nullable()->index('salary_adjustments_employee_id_foreign');
            $table->decimal('previous_salary', 10);
            $table->decimal('new_salary', 10);
            $table->string('adjustment_reason');
            $table->date('effective_date');
            $table->unsignedBigInteger('created_by')->nullable()->index('salary_adjustments_created_by_foreign');
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('salary_records', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('employee_id')->nullable()->index('salary_records_employee_id_foreign');
            $table->date('salary_date')->nullable();
            $table->decimal('basic_salary', 10);
            $table->decimal('allowances', 10)->nullable();
            $table->decimal('deductions', 10)->nullable();
            $table->decimal('gross_salary', 10);
            $table->decimal('net_salary', 10);
            $table->text('remarks')->nullable()->comment('Additional notes about the salary record.');
            $table->boolean('adjusts_balance')->default(false)->comment('Whether this salary record adjusts the pending balance.');
            $table->string('salary_from');
            $table->unsignedBigInteger('store_id')->index('salary_records_store_id_foreign');
            $table->unsignedBigInteger('created_by')->nullable()->index('salary_records_created_by_foreign');
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('sale_id')->index('sale_items_sale_id_foreign');
            $table->unsignedBigInteger('product_id')->nullable()->index('sale_items_product_id_foreign');
            $table->unsignedBigInteger('batch_id')->nullable()->index('sale_items_batch_id_foreign');
            $table->string('description')->nullable();
            $table->date('sale_date');
            $table->integer('quantity');
            $table->decimal('unit_price', 10);
            $table->decimal('unit_cost', 10);
            $table->decimal('discount', 10)->default(0);
            $table->unsignedBigInteger('created_by')->nullable()->index('sale_items_created_by_foreign');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sales', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('sale_type')->default('sale');
            $table->string('invoice_number')->nullable()->unique();
            $table->unsignedBigInteger('store_id')->index('sales_store_id_foreign');
            $table->unsignedBigInteger('contact_id')->index('sales_contact_id_foreign');
            $table->date('sale_date');
            $table->decimal('total_amount', 10);
            $table->decimal('discount', 10)->default(0);
            $table->decimal('amount_received', 10);
            $table->decimal('profit_amount', 10)->default(0);
            $table->string('status')->default('pending');
            $table->string('payment_status')->default('pending');
            $table->text('note')->nullable();
            $table->unsignedBigInteger('created_by')->nullable()->index('sales_created_by_foreign');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('meta_key')->unique();
            $table->text('meta_value')->nullable();
            $table->unsignedBigInteger('store_id')->nullable();
            $table->timestamps();
        });

        Schema::create('stores', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('address');
            $table->string('contact_number');
            $table->string('sale_prefix')->nullable();
            $table->integer('current_sale_number')->nullable();
            $table->integer('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->unsignedBigInteger('sales_id')->nullable()->index('transactions_sales_id_foreign');
            $table->unsignedBigInteger('store_id')->index('transactions_store_id_foreign');
            $table->unsignedBigInteger('contact_id')->index('transactions_contact_id_foreign');
            $table->date('transaction_date');
            $table->decimal('amount', 10);
            $table->string('payment_method');
            $table->string('transaction_type');
            $table->string('note')->nullable();
            $table->integer('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('user_name')->unique();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('user_role')->default('user');
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->boolean('is_active')->default(true);
            $table->integer('store_id')->nullable()->default(1);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::table('cash_logs', function (Blueprint $table) {
            $table->foreign(['contact_id'])->references(['id'])->on('contacts')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['created_by'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['store_id'])->references(['id'])->on('stores')->onUpdate('no action')->onDelete('no action');
        });

        Schema::table('cheques', function (Blueprint $table) {
            $table->foreign(['created_by'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['store_id'])->references(['id'])->on('stores')->onUpdate('no action')->onDelete('cascade');
        });

        Schema::table('employee_balance_logs', function (Blueprint $table) {
            $table->foreign(['created_by'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['employee_id'])->references(['id'])->on('employees')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['store_id'])->references(['id'])->on('stores')->onUpdate('no action')->onDelete('no action');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->foreign(['created_by'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['store_id'])->references(['id'])->on('stores')->onUpdate('no action')->onDelete('no action');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->foreign(['store_id'])->references(['id'])->on('stores')->onUpdate('no action')->onDelete('no action');
        });

        Schema::table('loyalty_point_transactions', function (Blueprint $table) {
            $table->foreign(['contact_id'])->references(['id'])->on('contacts')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['store_id'])->references(['id'])->on('stores')->onUpdate('no action')->onDelete('cascade');
        });

        Schema::table('model_has_permissions', function (Blueprint $table) {
            $table->foreign(['permission_id'])->references(['id'])->on('permissions')->onUpdate('no action')->onDelete('cascade');
        });

        Schema::table('model_has_roles', function (Blueprint $table) {
            $table->foreign(['role_id'])->references(['id'])->on('roles')->onUpdate('no action')->onDelete('cascade');
        });

        Schema::table('product_batches', function (Blueprint $table) {
            $table->foreign(['contact_id'])->references(['id'])->on('contacts')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['product_id'])->references(['id'])->on('products')->onUpdate('no action')->onDelete('no action');
        });

        Schema::table('product_stocks', function (Blueprint $table) {
            $table->foreign(['batch_id'])->references(['id'])->on('product_batches')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['product_id'])->references(['id'])->on('products')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['store_id'])->references(['id'])->on('stores')->onUpdate('no action')->onDelete('no action');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->foreign(['attachment_id'])->references(['id'])->on('attachments')->onUpdate('no action')->onDelete('set null');
        });

        Schema::table('purchase_items', function (Blueprint $table) {
            $table->foreign(['batch_id'])->references(['id'])->on('product_batches')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['created_by'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['product_id'])->references(['id'])->on('products')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['purchase_id'])->references(['id'])->on('purchases')->onUpdate('no action')->onDelete('no action');
        });

        Schema::table('purchase_transactions', function (Blueprint $table) {
            $table->foreign(['contact_id'])->references(['id'])->on('contacts')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['purchase_id'])->references(['id'])->on('purchases')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['store_id'])->references(['id'])->on('stores')->onUpdate('no action')->onDelete('no action');
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->foreign(['contact_id'])->references(['id'])->on('contacts')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['store_id'])->references(['id'])->on('stores')->onUpdate('no action')->onDelete('no action');
        });

        Schema::table('quantity_adjustments', function (Blueprint $table) {
            $table->foreign(['batch_id'])->references(['id'])->on('product_batches')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['stock_id'])->references(['id'])->on('product_stocks')->onUpdate('no action')->onDelete('no action');
        });

        Schema::table('reload_and_bill_metas', function (Blueprint $table) {
            $table->foreign(['sale_item_id'])->references(['id'])->on('sale_items')->onUpdate('no action')->onDelete('cascade');
        });

        Schema::table('role_has_permissions', function (Blueprint $table) {
            $table->foreign(['permission_id'])->references(['id'])->on('permissions')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['role_id'])->references(['id'])->on('roles')->onUpdate('no action')->onDelete('cascade');
        });

        Schema::table('salary_adjustments', function (Blueprint $table) {
            $table->foreign(['created_by'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['employee_id'])->references(['id'])->on('employees')->onUpdate('no action')->onDelete('set null');
        });

        Schema::table('salary_records', function (Blueprint $table) {
            $table->foreign(['created_by'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['employee_id'])->references(['id'])->on('employees')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['store_id'])->references(['id'])->on('stores')->onUpdate('no action')->onDelete('no action');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->foreign(['batch_id'])->references(['id'])->on('product_batches')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['created_by'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['product_id'])->references(['id'])->on('products')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['sale_id'])->references(['id'])->on('sales')->onUpdate('no action')->onDelete('no action');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->foreign(['contact_id'])->references(['id'])->on('contacts')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['created_by'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['store_id'])->references(['id'])->on('stores')->onUpdate('no action')->onDelete('no action');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->foreign(['contact_id'])->references(['id'])->on('contacts')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['sales_id'])->references(['id'])->on('sales')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['store_id'])->references(['id'])->on('stores')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign('transactions_contact_id_foreign');
            $table->dropForeign('transactions_sales_id_foreign');
            $table->dropForeign('transactions_store_id_foreign');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign('sales_contact_id_foreign');
            $table->dropForeign('sales_created_by_foreign');
            $table->dropForeign('sales_store_id_foreign');
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropForeign('sale_items_batch_id_foreign');
            $table->dropForeign('sale_items_created_by_foreign');
            $table->dropForeign('sale_items_product_id_foreign');
            $table->dropForeign('sale_items_sale_id_foreign');
        });

        Schema::table('salary_records', function (Blueprint $table) {
            $table->dropForeign('salary_records_created_by_foreign');
            $table->dropForeign('salary_records_employee_id_foreign');
            $table->dropForeign('salary_records_store_id_foreign');
        });

        Schema::table('salary_adjustments', function (Blueprint $table) {
            $table->dropForeign('salary_adjustments_created_by_foreign');
            $table->dropForeign('salary_adjustments_employee_id_foreign');
        });

        Schema::table('role_has_permissions', function (Blueprint $table) {
            $table->dropForeign('role_has_permissions_permission_id_foreign');
            $table->dropForeign('role_has_permissions_role_id_foreign');
        });

        Schema::table('reload_and_bill_metas', function (Blueprint $table) {
            $table->dropForeign('reload_and_bill_metas_sale_item_id_foreign');
        });

        Schema::table('quantity_adjustments', function (Blueprint $table) {
            $table->dropForeign('quantity_adjustments_batch_id_foreign');
            $table->dropForeign('quantity_adjustments_stock_id_foreign');
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->dropForeign('purchases_contact_id_foreign');
            $table->dropForeign('purchases_store_id_foreign');
        });

        Schema::table('purchase_transactions', function (Blueprint $table) {
            $table->dropForeign('purchase_transactions_contact_id_foreign');
            $table->dropForeign('purchase_transactions_purchase_id_foreign');
            $table->dropForeign('purchase_transactions_store_id_foreign');
        });

        Schema::table('purchase_items', function (Blueprint $table) {
            $table->dropForeign('purchase_items_batch_id_foreign');
            $table->dropForeign('purchase_items_created_by_foreign');
            $table->dropForeign('purchase_items_product_id_foreign');
            $table->dropForeign('purchase_items_purchase_id_foreign');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign('products_attachment_id_foreign');
        });

        Schema::table('product_stocks', function (Blueprint $table) {
            $table->dropForeign('product_stocks_batch_id_foreign');
            $table->dropForeign('product_stocks_product_id_foreign');
            $table->dropForeign('product_stocks_store_id_foreign');
        });

        Schema::table('product_batches', function (Blueprint $table) {
            $table->dropForeign('product_batches_contact_id_foreign');
            $table->dropForeign('product_batches_product_id_foreign');
        });

        Schema::table('model_has_roles', function (Blueprint $table) {
            $table->dropForeign('model_has_roles_role_id_foreign');
        });

        Schema::table('model_has_permissions', function (Blueprint $table) {
            $table->dropForeign('model_has_permissions_permission_id_foreign');
        });

        Schema::table('loyalty_point_transactions', function (Blueprint $table) {
            $table->dropForeign('loyalty_point_transactions_contact_id_foreign');
            $table->dropForeign('loyalty_point_transactions_store_id_foreign');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign('expenses_store_id_foreign');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign('employees_created_by_foreign');
            $table->dropForeign('employees_store_id_foreign');
        });

        Schema::table('employee_balance_logs', function (Blueprint $table) {
            $table->dropForeign('employee_balance_logs_created_by_foreign');
            $table->dropForeign('employee_balance_logs_employee_id_foreign');
            $table->dropForeign('employee_balance_logs_store_id_foreign');
        });

        Schema::table('cheques', function (Blueprint $table) {
            $table->dropForeign('cheques_created_by_foreign');
            $table->dropForeign('cheques_store_id_foreign');
        });

        Schema::table('cash_logs', function (Blueprint $table) {
            $table->dropForeign('cash_logs_contact_id_foreign');
            $table->dropForeign('cash_logs_created_by_foreign');
            $table->dropForeign('cash_logs_store_id_foreign');
        });

        Schema::dropIfExists('users');

        Schema::dropIfExists('transactions');

        Schema::dropIfExists('stores');

        Schema::dropIfExists('settings');

        Schema::dropIfExists('sessions');

        Schema::dropIfExists('sales');

        Schema::dropIfExists('sale_items');

        Schema::dropIfExists('salary_records');

        Schema::dropIfExists('salary_adjustments');

        Schema::dropIfExists('roles');

        Schema::dropIfExists('role_has_permissions');

        Schema::dropIfExists('reload_and_bill_metas');

        Schema::dropIfExists('quotations');

        Schema::dropIfExists('quotation_items');

        Schema::dropIfExists('quantity_adjustments');

        Schema::dropIfExists('purchases');

        Schema::dropIfExists('purchase_transactions');

        Schema::dropIfExists('purchase_items');

        Schema::dropIfExists('products');

        Schema::dropIfExists('product_stocks');

        Schema::dropIfExists('product_batches');

        Schema::dropIfExists('permissions');

        Schema::dropIfExists('password_reset_tokens');

        Schema::dropIfExists('model_has_roles');

        Schema::dropIfExists('model_has_permissions');

        Schema::dropIfExists('loyalty_point_transactions');

        Schema::dropIfExists('jobs');

        Schema::dropIfExists('job_batches');

        Schema::dropIfExists('failed_jobs');

        Schema::dropIfExists('expenses');

        Schema::dropIfExists('employees');

        Schema::dropIfExists('employee_balance_logs');

        Schema::dropIfExists('contacts');

        Schema::dropIfExists('collections');

        Schema::dropIfExists('cheques');

        Schema::dropIfExists('cash_logs');

        Schema::dropIfExists('cache_locks');

        Schema::dropIfExists('cache');

        Schema::dropIfExists('authentication_log');

        Schema::dropIfExists('attachments');

        Schema::dropIfExists('activity_log');
    }
};
