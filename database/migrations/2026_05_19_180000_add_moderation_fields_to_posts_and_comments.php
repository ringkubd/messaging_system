<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('moderation_status')->default('pending')->after('media');
            $table->text('moderation_reason')->nullable()->after('moderation_status');
            $table->timestamp('moderated_at')->nullable()->after('moderation_reason');
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->string('moderation_status')->default('pending')->after('media');
            $table->text('moderation_reason')->nullable()->after('moderation_status');
            $table->timestamp('moderated_at')->nullable()->after('moderation_reason');
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->index(['moderation_status', 'created_at']);
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->index(['moderation_status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex(['moderation_status', 'created_at']);
            $table->dropColumn(['moderation_status', 'moderation_reason', 'moderated_at']);
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropIndex(['moderation_status', 'created_at']);
            $table->dropColumn(['moderation_status', 'moderation_reason', 'moderated_at']);
        });
    }
};
