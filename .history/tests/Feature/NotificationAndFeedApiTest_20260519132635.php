<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationAndFeedApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_message_send_creates_in_app_notification_for_recipient(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        Sanctum::actingAs($sender);

        $conversationId = $this->postJson('/api/v1/conversations', [
            'participant_id' => $recipient->id,
        ])->assertCreated()->json('id');

        $this->postJson('/api/v1/conversations/' . $conversationId . '/messages', [
            'body' => 'You should be notified',
        ])->assertCreated();

        Sanctum::actingAs($recipient);

        $notificationList = $this->getJson('/api/v1/notifications')
            ->assertOk()
            ->json('data');

        $this->assertNotEmpty($notificationList);
        $this->assertSame('conversation_message', $notificationList[0]['data']['kind']);
    }

    public function test_user_can_update_notification_preferences(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/notification-preferences')
            ->assertOk()
            ->assertJsonPath('chat_message_in_app', true);

        $this->patchJson('/api/v1/notification-preferences', [
            'chat_message_in_app' => false,
            'group_message_in_app' => false,
        ])->assertOk()
            ->assertJsonPath('chat_message_in_app', false)
            ->assertJsonPath('group_message_in_app', false);
    }

    public function test_user_can_create_community_post_comment_and_react(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        Sanctum::actingAs($owner);

        $communityId = $this->postJson('/api/v1/communities', [
            'name' => 'Laravel Fans',
            'description' => 'We share updates',
        ])->assertCreated()->json('id');

        Sanctum::actingAs($member);
        $this->postJson('/api/v1/communities/' . $communityId . '/join')->assertOk();

        $postId = $this->postJson('/api/v1/posts', [
            'community_id' => $communityId,
            'body' => 'First community post',
        ])->assertCreated()->json('id');

        $commentId = $this->postJson('/api/v1/posts/' . $postId . '/comments', [
            'body' => 'Nice post!',
        ])->assertCreated()->json('id');

        $this->postJson('/api/v1/posts/' . $postId . '/reactions', [
            'type' => 'like',
        ])->assertCreated();

        $this->postJson('/api/v1/comments/' . $commentId . '/reactions', [
            'type' => 'love',
        ])->assertCreated();

        $this->getJson('/api/v1/posts?community_id=' . $communityId)
            ->assertOk()
            ->assertJsonFragment(['id' => $postId]);
    }

    public function test_community_owner_can_invite_accepted_friend(): void
    {
        $owner = User::factory()->create();
        $friend = User::factory()->create();

        Sanctum::actingAs($owner);

        $friendshipId = $this->postJson('/api/v1/friendships', [
            'user_id' => $friend->id,
        ])->assertCreated()->json('id');

        Sanctum::actingAs($friend);
        $this->patchJson('/api/v1/friendships/' . $friendshipId . '/respond', [
            'status' => 'accepted',
        ])->assertOk();

        Sanctum::actingAs($owner);
        $communityId = $this->postJson('/api/v1/communities', [
            'name' => 'Batchmates Network',
        ])->assertCreated()->json('id');

        $this->postJson('/api/v1/communities/' . $communityId . '/invite', [
            'user_id' => $friend->id,
        ])->assertOk();

        Sanctum::actingAs($friend);
        $this->getJson('/api/v1/communities/' . $communityId)
            ->assertOk()
            ->assertJsonFragment(['id' => $friend->id]);
    }

    public function test_user_can_create_image_only_post(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->post('/api/v1/posts', [
            'images' => [UploadedFile::fake()->image('update.jpg')],
        ], [
            'Accept' => 'application/json',
        ]);

        $response->assertCreated();
        $this->assertNotEmpty($response->json('media'));
        $this->assertNull($response->json('body'));
    }
}
