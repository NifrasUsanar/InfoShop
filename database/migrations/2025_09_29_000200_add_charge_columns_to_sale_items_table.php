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
        Schema::table('sale_items', function (Blueprint $table) {
            $table->string('item_type')->default('product')->after('id')->comment('product or charge');
            $table->unsignedBigInteger('charge_id')->nullable()->after('item_type')->comment('Reference to charges table');
            $table->string('charge_type')->nullable()->after('charge_id')->comment('tax, service_charge, delivery_fee, discount, gratuity, custom');
            $table->decimal('rate_value', 10, 2)->nullable()->after('charge_type')->comment('Percentage or fixed amount value');
            $table->string('rate_type')->nullable()->after('rate_value')->comment('percentage or fixed');
            $table->decimal('base_amount', 12, 2)->nullable()->after('rate_type')->comment('Amount this charge is calculated on');
            $table->text('notes')->nullable()->after('base_amount');
            
            $table->foreign('charge_id')->references('id')->on('charges')->onDelete('set null');
            $table->index('item_type');
            $table->index('charge_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropForeign(['charge_id']);
            $table->dropIndex(['item_type']);
            $table->dropIndex(['charge_type']);
            $table->dropColumn([
                'item_type',
                'charge_id',
                'charge_type',
                'rate_value',
                'rate_type',
                'base_amount',
                'notes'
            ]);
        });
    }
};
