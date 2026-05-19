<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->integer('points')->default(0);
            $table->integer('weekly_points')->default(0);
            $table->integer('monthly_points')->default(0);
            $table->dateTime('last_points_reset_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['points', 'weekly_points', 'monthly_points', 'last_points_reset_at']);
        });
    }
};
