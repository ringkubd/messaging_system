<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jobs', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->text('description');
            $table->string('type');
            $table->string('location')->nullable();
            $table->string('salary_range')->nullable();
            $table->text('requirements')->nullable();
            $table->text('responsibilities')->nullable();
            $table->json('skills_required')->nullable();
            $table->date('deadline')->nullable();
            $table->integer('max_applications')->nullable();
            $table->string('status')->default('draft');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'type']);
            $table->index('company_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jobs');
    }
};
