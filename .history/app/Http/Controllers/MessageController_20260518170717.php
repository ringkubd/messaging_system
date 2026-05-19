<?php

namespace App\Http\Controllers;

use App\Events\ConversationMessageSent;
use App\Events\ConversationTypingUpdated;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    public function index(Request $request, Conversation $conversation): JsonResponse
    {
        $this->abortUnlessParticipant($request, $conversation);

        $messages = $conversation->messages()
            ->with('sender:id,name')
            ->latest('id')
            ->paginate(30);

        return response()->json($messages);
    }

    public function store(Request $request, Conversation $conversation): JsonResponse
    {
        $this->abortUnlessParticipant($request, $conversation);

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

    public function typing(Request $request, Conversation $conversation): JsonResponse
    {
        $this->abortUnlessParticipant($request, $conversation);

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

    private function abortUnlessParticipant(Request $request, Conversation $conversation): void
    {
        $isParticipant = $conversation->participants()
            ->where('users.id', $request->user()->id)
            ->exists();

        abort_unless($isParticipant, 403, 'You are not a member of this conversation.');
    }
}
