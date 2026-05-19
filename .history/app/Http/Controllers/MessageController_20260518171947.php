<?php

namespace App\Http\Controllers;

use App\Events\ConversationMessageSent;
use App\Models\Conversation;
use App\Models\Message;
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
