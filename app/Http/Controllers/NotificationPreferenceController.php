<?php

namespace App\Http\Controllers;

use App\Models\NotificationPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $preferences = NotificationPreference::query()->firstOrCreate([
            'user_id' => $request->user()->id,
        ], [
            'chat_message_in_app' => true,
            'group_message_in_app' => true,
            'friend_request_in_app' => true,
            'post_interaction_in_app' => true,
            'chat_message_email' => true,
            'group_message_email' => true,
            'friend_request_email' => true,
            'post_interaction_email' => true,
        ]);

        return response()->json($preferences);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'chat_message_in_app' => ['nullable', 'boolean'],
            'group_message_in_app' => ['nullable', 'boolean'],
            'friend_request_in_app' => ['nullable', 'boolean'],
            'post_interaction_in_app' => ['nullable', 'boolean'],
            'chat_message_email' => ['nullable', 'boolean'],
            'group_message_email' => ['nullable', 'boolean'],
            'friend_request_email' => ['nullable', 'boolean'],
            'post_interaction_email' => ['nullable', 'boolean'],
        ]);

        $preferences = NotificationPreference::query()->firstOrCreate([
            'user_id' => $request->user()->id,
        ], [
            'chat_message_in_app' => true,
            'group_message_in_app' => true,
            'friend_request_in_app' => true,
            'post_interaction_in_app' => true,
            'chat_message_email' => true,
            'group_message_email' => true,
            'friend_request_email' => true,
            'post_interaction_email' => true,
        ]);

        $preferences->fill($data);
        $preferences->save();

        return response()->json($preferences->fresh());
    }
}
