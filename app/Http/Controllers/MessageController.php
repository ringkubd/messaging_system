<?php

namespace App\Http\Controllers;

use App\Events\ConversationMessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Support\Idempotency;
use App\Models\UserBlock;
use App\Services\FileUploadService;
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
        return Idempotency::rememberJsonResponse($request, 'conversation-message:' . $conversation->id, function () use ($request, $conversation) {
            $this->authorize('update', $conversation);

            $participantIds = $conversation->participants()->pluck('users.id');
            $otherParticipantIds = $participantIds->filter(fn ($id) => (int) $id !== (int) $request->user()->id)->values();

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
                'body' => ['nullable', 'string', 'max:5000'],
                'message_type' => ['nullable', 'string', 'max:50'],
                'metadata' => ['nullable', 'array'],
                'attachments' => ['nullable', 'array'],
                'attachments.*' => ['file', 'max:10240'],
                'voice' => ['nullable', 'file', 'mimes:webm,mp3,ogg,wav', 'max:10240'],
            ]);

            $attachments = [];

            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $upload = FileUploadService::upload($file, 'messages');
                    if ($upload) {
                        $attachments[] = $upload;
                    }
                }
            }

            if ($request->hasFile('voice')) {
                $upload = FileUploadService::upload($request->file('voice'), 'messages');
                if ($upload) {
                    $upload['type'] = 'voice';
                    $attachments[] = $upload;
                }
            }

            $message = DB::transaction(function () use ($request, $conversation, $data, $attachments) {
                $message = Message::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $request->user()->id,
                    'body' => $data['body'] ?? null,
                    'message_type' => $data['message_type'] ?? 'text',
                    'metadata' => $data['metadata'] ?? null,
                    'attachments' => $attachments ?: null,
                ]);

                $conversation->update(['last_message_at' => now()]);

                return $message;
            });

            $message->load('sender:id,name');

            broadcast(new ConversationMessageSent($message))->toOthers();

            return response()->json($message, 201);
        });
    }
}
