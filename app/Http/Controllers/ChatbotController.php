<?php

namespace App\Http\Controllers;

use App\Models\ChatbotConversation;
use App\Services\OllamaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatbotController extends Controller
{
    private const SYSTEM_PROMPT = <<<'PROMPT'
You are an AI assistant for the ISDB-BISEW Scholarship Community Platform.
Answer questions about:
- ISDB-BISEW scholarship program
- How to apply for scholarships
- Community features (feed, groups, chat, events, jobs, resources)
- How to connect with alumni
- Career and placement support
- Platform navigation

Be concise, helpful, and friendly. If you don't know something, say so politely.
Keep responses under 200 words.

Common FAQs:
Q: What is ISDB-BISEW?
A: Islamic Development Bank - Bangladesh Islamic Solidarity Educational Wakf (ISDB-BISEW) provides scholarships for Bangladeshi students to pursue higher education.

Q: How do I apply for a scholarship?
A: Check the Scholarships page under References for current opportunities. Applications are processed through the official ISDB-BISEW portal during open cycles.

Q: How can I connect with other scholars?
A: Use the Directory to find scholars, send friend requests, join Communities, or participate in Group Chats. You can also attend Events to meet fellow scholars.

Q: How do I find job opportunities?
A: Visit the Jobs page to browse listings, set up job alerts, and track your applications. Employers post opportunities specifically for ISDB-BISEW scholars.

Q: How do I create a post in the feed?
A: Go to the Feed page and use the composer at the top to share updates, ask questions, or share resources with the community.

Q: How can I find alumni?
A: Visit the Alumni page to browse alumni profiles, filter by batch or round, and connect with graduates who share your background.

Q: What events are available?
A: The Events page lists workshops, networking sessions, webinars, and community meetups. You can register and receive reminders.

Q: How do I use the Resource Hub?
A: The Resources page contains study materials, guides, templates, and past exam papers. Browse by category or search for specific topics.

Q: How can I find a mentor?
A: Go to the Alumni or Directory page, find senior scholars or alumni, and send them a mentorship request through their profile.

Q: How do I update my profile?
A: Click your name in the sidebar, then update your information including education, experience, and profile photo on the Profile page.

PROMPT;

    public function chat(Request $request, OllamaService $ollama): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'conversation_id' => ['nullable', 'integer', 'exists:chatbot_conversations,id'],
        ]);

        $user = $request->user();

        if ($data['conversation_id']) {
            $conversation = ChatbotConversation::findOrFail($data['conversation_id']);

            if ($conversation->user_id && $conversation->user_id !== $user->id) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        } else {
            $conversation = ChatbotConversation::create([
                'user_id' => $user->id,
                'session_id' => null,
                'messages' => [],
                'context' => null,
            ]);
        }

        $messages = $conversation->messages;

        $messages[] = [
            'role' => 'user',
            'content' => $data['message'],
            'timestamp' => now()->toIso8601String(),
        ];

        $prompt = self::SYSTEM_PROMPT . "\n\n---\n\n";

        foreach ($messages as $msg) {
            $role = $msg['role'] === 'assistant' ? 'Assistant' : 'User';
            $prompt .= $role . ': ' . $msg['content'] . "\n";
        }

        $prompt .= "\nAssistant:";

        try {
            $response = $ollama->generate($prompt);

            $messages[] = [
                'role' => 'assistant',
                'content' => $response,
                'timestamp' => now()->toIso8601String(),
            ];

            $conversation->update(['messages' => $messages]);

            return response()->json([
                'response' => $response,
                'conversation_id' => $conversation->id,
            ]);
        } catch (\Exception $e) {
            $conversation->update(['messages' => $messages]);

            return response()->json([
                'response' => 'Sorry, I am having trouble connecting right now. Please try again.',
                'conversation_id' => $conversation->id,
            ]);
        }
    }

    public function history(Request $request): JsonResponse
    {
        $conversations = ChatbotConversation::where('user_id', $request->user()->id)
            ->orderBy('updated_at', 'desc')
            ->get(['id', 'messages', 'created_at', 'updated_at']);

        $conversations->transform(function ($conv) {
            $firstUserMsg = collect($conv->messages)->firstWhere('role', 'user');
            $conv->preview = $firstUserMsg ? $firstUserMsg['content'] : null;
            $conv->message_count = count($conv->messages) / 2;
            unset($conv->messages);
            return $conv;
        });

        return response()->json($conversations);
    }
}
