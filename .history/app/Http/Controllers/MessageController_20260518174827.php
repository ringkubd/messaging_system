<?php

namespace App\Http\Controllers;

use App\Events\ConversationMessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\UserBlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    public function index(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $messages = $conversation->messages()
            ->with('sender:id,name')
            ->latest('id')
            ->paginate(30);

        return response()->json($messages);
    }

    public function store(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('update', $conversation);

        $participantIds = $conversation->participants()->pluck('users.id');
        $otherParticipantIds = $participantIds->filter(fn($id) => (int) $id !== (int) $request->user()->id)->values();

        if ($otherParticipantIds->isNotEmpty()) {
            $hasBlock = UserBlock::query()
                ->where(function ($query) use ($request, $otherParticipantIds) {
                    $query->where('blocker_id', $request->user()->id)
                        ->whereIn('blocked_id', $otherParticipantIds);
                })
                ->orWhere(function ($query) use ($request, $otherParticipantIds) {
                    $query->whereIn('blocker_id', $otherParticipantIds)
                        ->where('blocked_id', $request->user()->id);
                })
                ->exists();

            if ($hasBlock) {
                return response()->json([
                    'message' => 'Message cannot be sent because one user blocked the other.',
                ], 422);
            }
        }

        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
            'message_type' => ['nullable', 'string', 'max:50'],
            'metadata' => ['nullable', 'array'],
        ]);

        $message = DB::transaction(function () use ($request, $conversation, $data) {
            $message = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $request->user()->id,
                'body' => $data['body'],
                'message_type' => $data['message_type'] ?? 'text',
                'metadata' => $data['metadata'] ?? null,
            ]);

            $conversation->update(['last_message_at' => now()]);

            return $message;
        });

        broadcast(new ConversationMessageSent($message))->toOthers();

        return response()->json($message->load('sender:id,name'), 201);
    }
}
