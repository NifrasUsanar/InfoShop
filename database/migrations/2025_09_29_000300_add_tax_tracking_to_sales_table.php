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
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('total_charge_amount', 12, 2)->default(0)->after('total_amount')->comment('Sum of all charges (taxes, fees, etc)');

            $table->index('total_charge_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['total_charge_amount']);
            $table->dropColumn(['total_charge_amount']);
        });
    }
};
