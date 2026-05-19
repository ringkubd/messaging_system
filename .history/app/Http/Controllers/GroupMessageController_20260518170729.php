<?php

namespace App\Http\Controllers;

use App\Events\GroupMessageSent;
use App\Events\GroupTypingUpdated;
use App\Models\ChatGroup;
use App\Models\GroupMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroupMessageController extends Controller
{
    public function index(Request $request, ChatGroup $group): JsonResponse
    {
        $this->abortUnlessMember($request, $group);

        $messages = $group->messages()
            ->with('sender:id,name')
            ->latest('id')
            ->paginate(30);

        return response()->json($messages);
    }

    public function store(Request $request, ChatGroup $group): JsonResponse
    {
        $this->abortUnlessMember($request, $group);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
            'message_type' => ['nullable', 'string', 'max:50'],
            'metadata' => ['nullable', 'array'],
        ]);

        $message = GroupMessage::create([
            'chat_group_id' => $group->id,
            'sender_id' => $request->user()->id,
            'body' => $data['body'],
            'message_type' => $data['message_type'] ?? 'text',
            'metadata' => $data['metadata'] ?? null,
        ]);

        broadcast(new GroupMessageSent($message))->toOthers();

        return response()->json($message->load('sender:id,name'), 201);
    }

    public function typing(Request $request, ChatGroup $group): JsonResponse
    {
        $this->abortUnlessMember($request, $group);

        $data = $request->validate([
            'is_typing' => ['required', 'boolean'],
        ]);

        broadcast(new GroupTypingUpdated(
            $group->id,
            $request->user()->id,
            $request->user()->name,
            (bool) $data['is_typing']
        ))->toOthers();

        return response()->json([
            'status' => 'ok',
            'group_id' => $group->id,
            'is_typing' => (bool) $data['is_typing'],
        ]);
    }

    private function abortUnlessMember(Request $request, ChatGroup $group): void
    {
        $isMember = $group->members()
            ->where('users.id', $request->user()->id)
            ->exists();

        abort_unless($isMember, 403, 'You are not a member of this group.');
    }
}
