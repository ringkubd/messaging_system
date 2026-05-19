<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GroupAndFriendshipApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_group_members_can_send_messages_and_non_members_are_blocked(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $outsider = User::factory()->create();

        Sanctum::actingAs($owner);

        $groupResponse = $this->postJson('/api/v1/groups', [
            'name' => 'Core Team',
            'member_ids' => [$member->id],
        ]);

        $groupResponse->assertCreated();
        $groupId = $groupResponse->json('id');

        Sanctum::actingAs($member);
        $this->postJson("/api/v1/groups/{$groupId}/messages", [
            'body' => 'Group hello',
        ])->assertCreated();

        Sanctum::actingAs($outsider);
        $this->postJson("/api/v1/groups/{$groupId}/messages", [
            'body' => 'I should fail',
        ])->assertForbidden();
    }

    public function test_friendship_request_can_be_accepted_by_receiver(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        Sanctum::actingAs($sender);

        $requestResponse = $this->postJson('/api/v1/friendships', [
            'user_id' => $receiver->id,
        ]);

        $requestResponse->assertCreated();
        $friendshipId = $requestResponse->json('id');

        Sanctum::actingAs($receiver);

        $this->patchJson("/api/v1/friendships/{$friendshipId}/respond", [
            'status' => 'accepted',
        ])->assertOk()->assertJsonPath('status', 'accepted');
    }
}
