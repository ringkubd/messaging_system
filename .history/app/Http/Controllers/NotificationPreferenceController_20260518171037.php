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
        ]);

        $preferences = NotificationPreference::query()->firstOrCreate([
            'user_id' => $request->user()->id,
        ]);

        $preferences->fill($data);
        $preferences->save();

        return response()->json($preferences->fresh());
    }
}
