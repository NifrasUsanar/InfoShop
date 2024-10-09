<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->integer('store_id'); // Store ID (link to the store making the purchase)
            $table->integer('vendor_id'); // Vendor ID (link to the supplier providing the products)
            $table->timestamp('purchase_date')->useCurrent(); // Date of purchase
            $table->string('reference_no');
            $table->decimal('total_amount', 10, 2); // Total amount of the purchase
            $table->decimal('discount', 10, 2)->default(0); // Discount applied on the purchase
            $table->decimal('amount_paid', 10, 2); // Amount paid so far
            $table->string('payment_status'); //['paid', 'partial', 'pending', 'overdue']
            $table->string('status'); //['completed', 'pending', 'canceled']
            $table->text('note')->nullable(); // Optional notes on the purchase
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};