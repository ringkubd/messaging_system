<?php

namespace App\Http\Controllers;

use App\Models\LiveStream;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class LiveStreamController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = LiveStream::query()
            ->with('creator:id,name')
            ->latest();

        if ($request->filled('status')) {
            if ($request->input('status') === 'live') {
                $query->live();
            } elseif ($request->input('status') === 'ended') {
                $query->ended();
            } elseif ($request->input('status') === 'scheduled') {
                $query->scheduled();
            }
        } else {
            $query->published();
        }

        return response()->json($query->paginate(12));
    }

    public function show(LiveStream $liveStream): JsonResponse
    {
        $liveStream->load('creator:id,name', 'event:id,title');

        return response()->json($liveStream);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'scheduled_at' => ['nullable', 'date', 'after_or_equal:now'],
            'max_viewers' => ['nullable', 'integer', 'min:0'],
            'thumbnail_url' => ['nullable', 'string', 'url', 'max:500'],
            'event_id' => ['nullable', 'integer', 'exists:events,id'],
        ]);

        $data['created_by'] = $request->user()->id;

        $liveStream = LiveStream::create($data);
        $liveStream->load('creator:id,name');

        // Create LiveKit room for browser-based streaming
        $this->createLiveKitRoom($liveStream);

        return response()->json($liveStream, 201);
    }

    public function update(Request $request, LiveStream $liveStream): JsonResponse
    {
        if ($liveStream->created_by !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (in_array($liveStream->status, ['live', 'ended'], true)) {
            return response()->json(['message' => 'Cannot update a stream that is live or has ended.'], 422);
        }

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'scheduled_at' => ['nullable', 'date', 'after_or_equal:now'],
            'max_viewers' => ['nullable', 'integer', 'min:0'],
            'thumbnail_url' => ['nullable', 'string', 'url', 'max:500'],
            'event_id' => ['nullable', 'integer', 'exists:events,id'],
        ]);

        $liveStream->update($data);
        $liveStream->load('creator:id,name');

        return response()->json($liveStream);
    }

    public function destroy(Request $request, LiveStream $liveStream): JsonResponse
    {
        if ($liveStream->created_by !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $liveStream->delete();

        return response()->json(['message' => 'Stream deleted.']);
    }

    public function startStream(Request $request, LiveStream $liveStream): JsonResponse
    {
        if ($liveStream->created_by !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($liveStream->status !== 'scheduled') {
            return response()->json(['message' => 'Stream can only be started from scheduled status.'], 422);
        }

        $liveStream->update([
            'status' => 'live',
            'started_at' => now(),
        ]);

        $liveStream->load('creator:id,name');

        return response()->json($liveStream);
    }

    public function endStream(Request $request, LiveStream $liveStream): JsonResponse
    {
        if ($liveStream->created_by !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($liveStream->status !== 'live') {
            return response()->json(['message' => 'Only live streams can be ended.'], 422);
        }

        $liveStream->update([
            'status' => 'ended',
            'ended_at' => now(),
        ]);

        $liveStream->load('creator:id,name');

        return response()->json($liveStream);
    }

    public function status(LiveStream $liveStream): JsonResponse
    {
        return response()->json([
            'id' => $liveStream->id,
            'status' => $liveStream->status,
            'started_at' => $liveStream->started_at,
            'ended_at' => $liveStream->ended_at,
            'hls_url' => $liveStream->hls_url,
        ]);
    }

    public function myStreams(Request $request): JsonResponse
    {
        $streams = LiveStream::query()
            ->with('event:id,title')
            ->where('created_by', $request->user()->id)
            ->latest()
            ->paginate(20);

        return response()->json($streams);
    }

    public function generateToken(Request $request, LiveStream $liveStream): JsonResponse
    {
        if ($request->user()->id !== $liveStream->created_by && !$request->user()->isAdmin()) {
            if ($liveStream->status !== 'live') {
                return response()->json(['message' => 'Forbidden.'], 403);
            }
        }

        $mode = $request->input('mode', 'publish');
        $canPublish = $mode === 'publish' && $request->user()->id === $liveStream->created_by;

        $apiKey = config('livestream.livekit.api_key');
        $apiSecret = config('livestream.livekit.api_secret');
        $wsUrl = config('livestream.livekit.ws_url');

        if (!$apiKey || !$apiSecret) {
            return response()->json(['message' => 'LiveKit not configured.'], 500);
        }

        $user = $request->user();
        $now = time();
        $payload = [
            'iss' => $apiKey,
            'sub' => $apiKey,
            'aud' => 'livekit',
            'iat' => $now,
            'exp' => $now + 7200,
            'nbf' => $now,
            'jti' => $liveStream->stream_key . '-' . $user->id . '-' . $now,
            'video' => [
                'room' => $liveStream->stream_key,
                'roomJoin' => true,
                'roomList' => true,
                'roomRecord' => false,
                'roomCreate' => false,
                'canPublish' => $canPublish,
                'canSubscribe' => true,
                'canPublishData' => true,
            ],
            'name' => $user->name,
            'identity' => (string) $user->id,
            'metadata' => json_encode([
                'user_id' => $user->id,
                'name' => $user->name,
            ]),
        ];

        $token = $this->encodeJwt($payload, $apiSecret);

        return response()->json([
            'token' => $token,
            'ws_url' => $wsUrl,
            'room' => $liveStream->stream_key,
        ]);
    }

    private function encodeJwt(array $payload, string $secret): string
    {
        $header = self::base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payloadStr = self::base64UrlEncode(json_encode($payload));
        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "{$header}.{$payloadStr}", $secret, true)
        );
        return "{$header}.{$payloadStr}.{$signature}";
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function createLiveKitRoom(LiveStream $liveStream): void
    {
        $apiUrl = config('livestream.livekit.host');
        $apiKey = config('livestream.livekit.api_key');
        $apiSecret = config('livestream.livekit.api_secret');

        if (!$apiUrl || !$apiKey || !$apiSecret) {
            return;
        }

        try {
            $token = $this->encodeJwt([
                'iss' => $apiKey,
                'sub' => $apiKey,
                'aud' => 'livekit',
                'iat' => time(),
                'exp' => time() + 300,
                'video' => ['roomCreate' => true, 'roomList' => true, 'roomAdmin' => true],
            ], $apiSecret);

            Http::withToken($token)
                ->timeout(5)
                ->post("{$apiUrl}/twirp/livekit.RoomService/CreateRoom", [
                    'name' => $liveStream->stream_key,
                    'max_participants' => $liveStream->max_viewers ?? 50,
                    'empty_timeout' => 600,
                ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('LiveKit create room failed', [
                'stream' => $liveStream->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    // Called by SRS/nginx RTMP on_publish hook (no auth middleware)
    public function authStream(Request $request): \Illuminate\Http\Response
    {
        $key = $request->query('key') ?: $request->input('name');
        $stream = LiveStream::where('stream_key', $key)
            ->where('status', 'scheduled')
            ->first();

        if (!$stream) {
            return response('Stream not found or not scheduled', 403);
        }

        $stream->update([
            'status' => 'live',
            'started_at' => now(),
        ]);

        return response('OK', 200);
    }

    // Called by SRS/nginx when stream ends
    public function endStreamByKey(Request $request): \Illuminate\Http\Response
    {
        $key = $request->query('key') ?: $request->input('name');
        $stream = LiveStream::where('stream_key', $key)
            ->where('status', 'live')
            ->first();

        if ($stream) {
            $stream->update([
                'status' => 'ended',
                'ended_at' => now(),
            ]);
        }

        return response('OK', 200);
    }
}
