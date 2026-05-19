<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_preferences', function (Blueprint $table) {
            $table->boolean('chat_message_email')->default(true)->after('chat_message_in_app');
            $table->boolean('group_message_email')->default(true)->after('group_message_in_app');
            $table->boolean('friend_request_email')->default(true)->after('friend_request_in_app');
            $table->boolean('post_interaction_email')->default(true)->after('post_interaction_in_app');
        });
    }

    public function down(): void
    {
        Schema::table('notification_preferences', function (Blueprint $table) {
            $table->dropColumn([
                'chat_message_email',
                'group_message_email',
                'friend_request_email',
                'post_interaction_email',
            ]);
        });
    }
};
