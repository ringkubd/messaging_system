<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SafetyControlsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_block_prevents_friend_request_and_conversation_creation(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        Sanctum::actingAs($alice);
        $this->postJson('/api/v1/blocks', [
            'user_id' => $bob->id,
            'reason' => 'abuse',
        ])->assertCreated();

        $this->postJson('/api/v1/friendships', [
            'user_id' => $bob->id,
        ])->assertStatus(422);

        $this->postJson('/api/v1/conversations', [
            'participant_id' => $bob->id,
        ])->assertStatus(422);
    }

    public function test_block_prevents_sending_messages_in_existing_conversation(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        Sanctum::actingAs($alice);
        $conversationId = $this->postJson('/api/v1/conversations', [
            'participant_id' => $bob->id,
        ])->assertCreated()->json('id');

        Sanctum::actingAs($bob);
        $this->postJson('/api/v1/blocks', [
            'user_id' => $alice->id,
        ])->assertCreated();

        Sanctum::actingAs($alice);
        $this->postJson('/api/v1/conversations/' . $conversationId . '/messages', [
            'body' => 'This should fail',
        ])->assertStatus(422);
    }

    public function test_user_can_mute_conversation_and_group(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        Sanctum::actingAs($owner);
        $conversationId = $this->postJson('/api/v1/conversations', [
            'participant_id' => $member->id,
        ])->assertCreated()->json('id');

        $groupId = $this->postJson('/api/v1/groups', [
            'name' => 'Mute Test',
            'member_ids' => [$member->id],
        ])->assertCreated()->json('id');

        Sanctum::actingAs($member);

        $this->postJson('/api/v1/conversations/' . $conversationId . '/mute', [
            'minutes' => 30,
        ])->assertOk();

        $conversationPivot = DB::table('conversation_user')
            ->where('conversation_id', $conversationId)
            ->where('user_id', $member->id)
            ->first();

        $this->assertNotNull($conversationPivot?->muted_until);

        $this->postJson('/api/v1/groups/' . $groupId . '/mute', [
            'minutes' => 45,
        ])->assertOk();

        $groupPivot = DB::table('chat_group_user')
            ->where('chat_group_id', $groupId)
            ->where('user_id', $member->id)
            ->first();

        $this->assertNotNull($groupPivot?->muted_until);
    }
}
