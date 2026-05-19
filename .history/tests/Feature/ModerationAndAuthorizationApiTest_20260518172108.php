<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ModerationAndAuthorizationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_private_community_content_is_hidden_from_non_members(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $outsider = User::factory()->create();

        Sanctum::actingAs($owner);
        $communityId = $this->postJson('/api/v1/communities', [
            'name' => 'Private Club',
            'is_private' => true,
        ])->assertCreated()->json('id');

        Sanctum::actingAs($member);
        $this->postJson('/api/v1/communities/' . $communityId . '/join')->assertForbidden();

        Sanctum::actingAs($owner);
        $postId = $this->postJson('/api/v1/posts', [
            'community_id' => $communityId,
            'body' => 'Secret update',
        ])->assertCreated()->json('id');

        Sanctum::actingAs($outsider);
        $this->getJson('/api/v1/posts/' . $postId)->assertForbidden();

        $feed = $this->getJson('/api/v1/posts')->assertOk()->json('data');
        $postIds = array_column($feed, 'id');
        $this->assertNotContains($postId, $postIds);
    }

    public function test_group_member_management_is_policy_protected(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $outsider = User::factory()->create();

        Sanctum::actingAs($owner);
        $groupId = $this->postJson('/api/v1/groups', [
            'name' => 'Moderated Group',
            'member_ids' => [$member->id],
        ])->assertCreated()->json('id');

        Sanctum::actingAs($outsider);
        $this->postJson('/api/v1/groups/' . $groupId . '/members', [
            'user_id' => $outsider->id,
            'role' => 'admin',
        ])->assertForbidden();
    }

    public function test_reports_flow_requires_admin_for_queue_and_resolution(): void
    {
        $author = User::factory()->create();
        $reporter = User::factory()->create();
        $admin = User::factory()->create(['is_admin' => true]);

        Sanctum::actingAs($author);
        $postId = $this->postJson('/api/v1/posts', [
            'body' => 'Potentially bad content',
        ])->assertCreated()->json('id');

        Sanctum::actingAs($reporter);
        $reportId = $this->postJson('/api/v1/reports', [
            'target_type' => 'post',
            'target_id' => $postId,
            'reason' => 'spam',
            'details' => 'Looks like spam',
        ])->assertCreated()->json('id');

        $this->getJson('/api/v1/admin/reports')->assertForbidden();

        Sanctum::actingAs($admin);
        $this->getJson('/api/v1/admin/reports')
            ->assertOk()
            ->assertJsonFragment(['id' => $reportId]);

        $this->patchJson('/api/v1/admin/reports/' . $reportId . '/resolve', [
            'status' => 'reviewed',
        ])->assertOk()->assertJsonPath('status', 'reviewed');

        Sanctum::actingAs($reporter);
        $this->getJson('/api/v1/reports/mine')
            ->assertOk()
            ->assertJsonFragment(['id' => $reportId]);
    }
}
