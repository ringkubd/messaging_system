<?php

namespace Tests\Feature;

use App\Events\ConversationMessageSent;
use App\Events\ConversationReadUpdated;
use App\Events\ConversationTypingUpdated;
use App\Events\GroupMessageSent;
use App\Events\GroupTypingUpdated;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RealtimeChatApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_personal_message_send_dispatches_realtime_event(): void
    {
        Event::fake([ConversationMessageSent::class]);

        $alice = User::factory()->create();
        $bob = User::factory()->create();

        Sanctum::actingAs($alice);
        $conversation = $this->postJson('/api/v1/conversations', [
            'participant_id' => $bob->id,
        ])->assertCreated()->json();

        $this->postJson('/api/v1/conversations/' . $conversation['id'] . '/messages', [
            'body' => 'Realtime ping',
        ])->assertCreated();

        Event::assertDispatched(ConversationMessageSent::class);
    }

    public function test_read_receipt_updates_pivot_and_dispatches_event(): void
    {
        Event::fake([ConversationReadUpdated::class]);

        $alice = User::factory()->create();
        $bob = User::factory()->create();

        Sanctum::actingAs($alice);
        $conversationId = $this->postJson('/api/v1/conversations', [
            'participant_id' => $bob->id,
        ])->assertCreated()->json('id');

        $messageId = $this->postJson('/api/v1/conversations/' . $conversationId . '/messages', [
            'body' => 'Mark me read',
        ])->assertCreated()->json('id');

        Sanctum::actingAs($bob);
        $this->postJson('/api/v1/conversations/' . $conversationId . '/read', [
            'last_read_message_id' => $messageId,
        ])->assertOk()->assertJsonPath('last_read_message_id', $messageId);

        $pivot = DB::table('conversation_user')
            ->where('conversation_id', $conversationId)
            ->where('user_id', $bob->id)
            ->first();

        $this->assertNotNull($pivot);
        $this->assertSame($messageId, (int) $pivot->last_read_message_id);

        Event::assertDispatched(ConversationReadUpdated::class);
    }

    public function test_typing_endpoints_dispatch_events_for_members_only(): void
    {
        Event::fake([ConversationTypingUpdated::class, GroupTypingUpdated::class, GroupMessageSent::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        $outsider = User::factory()->create();

        Sanctum::actingAs($owner);
        $groupId = $this->postJson('/api/v1/groups', [
            'name' => 'Realtime Group',
            'member_ids' => [$member->id],
        ])->assertCreated()->json('id');

        $alice = User::factory()->create();
        $bob = User::factory()->create();
        Sanctum::actingAs($alice);
        $conversationId = $this->postJson('/api/v1/conversations', [
            'participant_id' => $bob->id,
        ])->assertCreated()->json('id');

        $this->postJson('/api/v1/conversations/' . $conversationId . '/typing', [
            'is_typing' => true,
        ])->assertOk();

        Event::assertDispatched(ConversationTypingUpdated::class);

        Sanctum::actingAs($member);
        $this->postJson('/api/v1/groups/' . $groupId . '/typing', [
            'is_typing' => true,
        ])->assertOk();

        Event::assertDispatched(GroupTypingUpdated::class);

        Sanctum::actingAs($outsider);
        $this->postJson('/api/v1/groups/' . $groupId . '/typing', [
            'is_typing' => true,
        ])->assertForbidden();
    }
}
