<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type');
            $table->string('file_url');
            $table->integer('file_size')->nullable();
            $table->string('file_type')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('resource_categories')->nullOnDelete();
            $table->json('tags')->nullable();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->integer('download_count')->default(0);
            $table->float('avg_rating')->default(0);
            $table->integer('ratings_count')->default(0);
            $table->string('status')->default('published');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['type', 'status']);
            $table->index('category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resources');
    }
};
