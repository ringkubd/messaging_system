<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
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
        $this->abortUnlessParticipant($request, $conversation);

        return response()->json(
            $conversation->load(['participants:id,name,email', 'latestMessage.sender:id,name'])
        );
    }

    private function abortUnlessParticipant(Request $request, Conversation $conversation): void
    {
        $isParticipant = $conversation->participants()
            ->where('users.id', $request->user()->id)
            ->exists();

        abort_unless($isParticipant, 403, 'You are not a member of this conversation.');
    }
}
