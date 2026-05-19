<?php

namespace App\Http\Controllers;

use App\Events\ConversationReadUpdated;
use App\Events\ConversationTypingUpdated;
use App\Models\Conversation;
use App\Models\UserBlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $conversations = Conversation::query()
            ->forUser($user->id)
            ->with(['participants:id,name,email', 'latestMessage.sender:id,name'])
            ->select('conversations.*')
            ->selectRaw('(
                SELECT COUNT(*) FROM messages
                WHERE messages.conversation_id = conversations.id
                AND messages.sender_id != ?
                AND messages.id > COALESCE(
                    (SELECT last_read_message_id FROM conversation_user
                     WHERE conversation_user.conversation_id = conversations.id
                     AND conversation_user.user_id = ?), 0
                )
            ) as unread_count', [$user->id, $user->id])
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($conversations);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'participant_id' => ['required', 'integer', 'exists:users,id', Rule::notIn([$request->user()->id])],
        ]);

        $currentUser = $request->user();
        $participantId = (int) $data['participant_id'];

        $hasBlock = UserBlock::query()
            ->where(function ($query) use ($currentUser, $participantId) {
                $query->where('blocker_id', $currentUser->id)
                    ->where('blocked_id', $participantId);
            })
            ->orWhere(function ($query) use ($currentUser, $participantId) {
                $query->where('blocker_id', $participantId)
                    ->where('blocked_id', $currentUser->id);
            })
            ->exists();

        if ($hasBlock) {
            return response()->json([
                'message' => 'Conversation is not allowed because one user blocked the other.',
            ], 422);
        }

        $conversation = Conversation::query()
            ->where('type', 'personal')
            ->whereHas('participants', function ($query) use ($currentUser) {
                $query->where('users.id', $currentUser->id);
            })
            ->whereHas('participants', function ($query) use ($participantId) {
                $query->where('users.id', $participantId);
            })
            ->has('participants', '=', 2)
            ->first();

        if ($conversation) {
            return response()->json($conversation->load('participants:id,name,email'));
        }

        $conversation = DB::transaction(function () use ($currentUser, $participantId) {
            $conversation = Conversation::create([
                'type' => 'personal',
            ]);

            $conversation->participants()->attach([
                $currentUser->id => ['joined_at' => now(), 'role' => 'member'],
                $participantId => ['joined_at' => now(), 'role' => 'member'],
            ]);

            return $conversation;
        });

        return response()->json($conversation->load('participants:id,name,email'), 201);
    }

    public function show(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        return response()->json(
            $conversation->load(['participants:id,name,email', 'latestMessage.sender:id,name'])
        );
    }

    public function markRead(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('update', $conversation);

        $data = $request->validate([
            'last_read_message_id' => ['nullable', 'integer'],
        ]);

        $lastReadMessageId = $data['last_read_message_id'] ?? null;

        if ($lastReadMessageId !== null) {
            $existsInConversation = $conversation->messages()
                ->where('id', $lastReadMessageId)
                ->exists();

            abort_unless($existsInConversation, 422, 'last_read_message_id is not part of this conversation.');
        }

        $conversation->participants()->updateExistingPivot($request->user()->id, [
            'last_read_message_id' => $lastReadMessageId,
        ]);

        broadcast(new ConversationReadUpdated($conversation->id, $request->user()->id, $lastReadMessageId))->toOthers();

        return response()->json([
            'status' => 'ok',
            'conversation_id' => $conversation->id,
            'last_read_message_id' => $lastReadMessageId,
        ]);
    }

    public function typing(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('update', $conversation);

        $data = $request->validate([
            'is_typing' => ['required', 'boolean'],
        ]);

        broadcast(new ConversationTypingUpdated(
            $conversation->id,
            $request->user()->id,
            $request->user()->name,
            (bool) $data['is_typing']
        ))->toOthers();

        return response()->json([
            'status' => 'ok',
            'conversation_id' => $conversation->id,
            'is_typing' => (bool) $data['is_typing'],
        ]);
    }

    public function mute(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('update', $conversation);

        $data = $request->validate([
            'minutes' => ['nullable', 'integer', 'min:1', 'max:43200'],
        ]);

        $minutes = $data['minutes'] ?? 60;
        $mutedUntil = now()->addMinutes($minutes);

        $conversation->participants()->updateExistingPivot($request->user()->id, [
            'muted_until' => $mutedUntil,
        ]);

        return response()->json([
            'status' => 'ok',
            'conversation_id' => $conversation->id,
            'muted_until' => $mutedUntil->toISOString(),
        ]);
    }
}
