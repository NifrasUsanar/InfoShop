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
        Schema::create('charges', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('charge_type')->default('custom')->comment('tax, service_charge, delivery_fee, discount, gratuity, custom, etc');
            $table->decimal('rate_value', 10, 2)->comment('Default percentage or fixed amount');
            $table->string('rate_type')->default('fixed')->comment('percentage or fixed');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false)->comment('Auto-apply this charge to all sales');
            $table->timestamps();

            $table->index('charge_type');
            $table->index('is_active');
            $table->index('is_default');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('charges');
    }
};
