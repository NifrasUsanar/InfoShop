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
        Schema::create('tax_and_fees', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Name of the tax or fee (e.g., VAT, Service Fee)
            $table->enum('type', ['tax', 'fee']); // Specify whether it’s a tax or fee
            $table->decimal('rate', 10, 2); // Rate of the tax or fee (percentage or fixed amount)
            $table->boolean('is_percentage')->default(true); // Whether the rate is a percentage or fixed amount
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tax_and_fees');
    }
};
