<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->addIndexIfMissing('posts', 'created_at');
        $this->addIndexIfMissing('posts', 'moderation_status');

        $this->addIndexIfMissing('comments', 'parent_id');

        $this->addIndexIfMissing('reactions', 'reactable_type');
        $this->addIndexIfMissing('reactions', 'reactable_id');
        $this->addIndexIfMissing('reactions', 'user_id');

        $this->addIndexIfMissing('messages', 'created_at');

        $this->addIndexIfMissing('notifications', 'read_at');
        $this->addIndexIfMissing('notifications', 'notifiable_id');
        $this->addIndexIfMissing('notifications', 'notifiable_type');

        $this->addIndexIfMissing('events', 'start_date');
        $this->addIndexIfMissing('events', 'status');
        $this->addIndexIfMissing('events', 'created_by');

        $this->addIndexIfMissing('jobs', 'status');
        $this->addIndexIfMissing('jobs', 'deadline');

        $this->addIndexIfMissing('resources', 'type');
        $this->addIndexIfMissing('resources', 'status');

        $this->addIndexIfMissing('chatbot_conversations', 'user_id');

        $this->addIndexIfMissing('audit_logs', 'user_id');
        $this->addIndexIfMissing('audit_logs', 'resource_type');
    }

    public function down(): void
    {
        $this->dropIndexIfExists('posts', 'created_at');
        $this->dropIndexIfExists('posts', 'moderation_status');

        $this->dropIndexIfExists('comments', 'parent_id');

        $this->dropIndexIfExists('reactions', 'reactable_type');
        $this->dropIndexIfExists('reactions', 'reactable_id');
        $this->dropIndexIfExists('reactions', 'user_id');

        $this->dropIndexIfExists('messages', 'created_at');

        $this->dropIndexIfExists('notifications', 'read_at');
        $this->dropIndexIfExists('notifications', 'notifiable_id');
        $this->dropIndexIfExists('notifications', 'notifiable_type');

        $this->dropIndexIfExists('events', 'start_date');
        $this->dropIndexIfExists('events', 'status');
        $this->dropIndexIfExists('events', 'created_by');

        $this->dropIndexIfExists('jobs', 'status');
        $this->dropIndexIfExists('jobs', 'deadline');

        $this->dropIndexIfExists('resources', 'type');
        $this->dropIndexIfExists('resources', 'status');

        $this->dropIndexIfExists('chatbot_conversations', 'user_id');

        $this->dropIndexIfExists('audit_logs', 'user_id');
        $this->dropIndexIfExists('audit_logs', 'resource_type');
    }

    protected function addIndexIfMissing(string $table, string $column): void
    {
        $indexName = $table . '_' . $column . '_index';

        if (! Schema::hasIndex($table, $indexName)) {
            Schema::table($table, function (Blueprint $table) use ($column) {
                $table->index($column);
            });
        }
    }

    protected function dropIndexIfExists(string $table, string $column): void
    {
        $indexName = $table . '_' . $column . '_index';

        if (Schema::hasIndex($table, $indexName)) {
            Schema::table($table, function (Blueprint $table) use ($indexName) {
                $table->dropIndex($indexName);
            });
        }
    }
};
