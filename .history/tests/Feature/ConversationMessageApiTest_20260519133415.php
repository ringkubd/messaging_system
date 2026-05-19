<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ConversationMessageApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_can_create_personal_conversation_and_exchange_messages(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        Sanctum::actingAs($alice);

        $conversationResponse = $this->postJson('/api/v1/conversations', [
            'participant_id' => $bob->id,
        ]);

        $conversationResponse->assertCreated();
        $conversationId = $conversationResponse->json('id');

        $this->postJson("/api/v1/conversations/{$conversationId}/messages", [
            'body' => 'Hello Bob',
        ])->assertCreated();

        Sanctum::actingAs($bob);

        $messagesResponse = $this->getJson("/api/v1/conversations/{$conversationId}/messages");
        $messagesResponse->assertOk()->assertJsonFragment(['body' => 'Hello Bob']);

        $charlie = User::factory()->create();
        Sanctum::actingAs($charlie);
        $this->getJson("/api/v1/conversations/{$conversationId}/messages")->assertForbidden();
    }

    public function test_message_creation_is_idempotent_with_same_request_key(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        Sanctum::actingAs($alice);

        $conversationId = $this->postJson('/api/v1/conversations', [
            'participant_id' => $bob->id,
        ])->assertCreated()->json('id');

        $headers = ['X-Idempotency-Key' => 'msg-123'];

        $first = $this->withHeaders($headers)->postJson("/api/v1/conversations/{$conversationId}/messages", [
            'body' => 'Hello once',
        ])->assertCreated();

        $second = $this->withHeaders($headers)->postJson("/api/v1/conversations/{$conversationId}/messages", [
            'body' => 'Hello once',
        ])->assertCreated();

        $this->assertSame($first->json('id'), $second->json('id'));
        $this->assertSame(1, (int) \App\Models\Message::query()->count());
    }
}
