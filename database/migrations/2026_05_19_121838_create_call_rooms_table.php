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
        Schema::create('call_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('room_sid', 64)->unique();
            $table->string('name');
            $table->string('type', 20)->default('video'); // video, audio, webinar
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('status', 20)->default('active'); // active, ended
            $table->integer('max_participants')->default(50);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });

        Schema::create('room_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained('call_rooms')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('participant_sid', 64)->nullable();
            $table->string('status', 20)->default('joining'); // joining, joined, left
            $table->boolean('mic_enabled')->default(true);
            $table->boolean('camera_enabled')->default(true);
            $table->boolean('screen_shared')->default(false);
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->timestamps();
            $table->unique(['room_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('call_rooms');
    }
};
