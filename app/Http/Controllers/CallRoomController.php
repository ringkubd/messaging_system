<?php

namespace App\Http\Controllers;

use App\Models\CallRoom;
use App\Models\RoomParticipant;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;

class CallRoomController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $rooms = CallRoom::query()
            ->with('creator:id,name')
            ->withCount('activeParticipants')
            ->where('status', 'active')
            ->latest()
            ->paginate(20);

        return response()->json($rooms);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:video,audio,webinar'],
            'max_participants' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $data['created_by'] = $request->user()->id;
        $data['started_at'] = now();

        $room = CallRoom::create($data);
        $room->load('creator:id,name');

        // Create the LiveKit room via API
        $this->createLiveKitRoom($room);

        return response()->json($room, 201);
    }

    public function show(CallRoom $callRoom): JsonResponse
    {
        $callRoom->load('creator:id,name', 'activeParticipants.user:id,name,avatar');
        return response()->json($callRoom);
    }

    public function destroy(Request $request, CallRoom $callRoom): JsonResponse
    {
        if ($callRoom->created_by !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $callRoom->update(['status' => 'ended', 'ended_at' => now()]);
        return response()->json(['message' => 'Room ended.']);
    }

    public function join(Request $request, CallRoom $callRoom): JsonResponse
    {
        if ($callRoom->status !== 'active') {
            return response()->json(['message' => 'Room is not active.'], 422);
        }

        $participant = RoomParticipant::firstOrCreate(
            ['room_id' => $callRoom->id, 'user_id' => $request->user()->id],
            ['status' => 'joining', 'joined_at' => now()]
        );

        $participant->update(['status' => 'joined', 'joined_at' => now()]);

        // Generate LiveKit token
        $token = $this->generateLiveKitToken($request->user(), $callRoom);

        return response()->json([
            'room' => $callRoom,
            'participant' => $participant,
            'token' => $token,
            'ws_url' => config('livestream.livekit.ws_url'),
        ]);
    }

    public function leave(Request $request, CallRoom $callRoom): JsonResponse
    {
        $participant = RoomParticipant::where('room_id', $callRoom->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($participant) {
            $participant->update(['status' => 'left', 'left_at' => now()]);
        }

        return response()->json(['message' => 'Left room.']);
    }

    public function myRooms(Request $request): JsonResponse
    {
        $rooms = CallRoom::query()
            ->with('creator:id,name')
            ->withCount('activeParticipants')
            ->whereHas('participants', fn ($q) => $q->where('user_id', $request->user()->id))
            ->orWhere('created_by', $request->user()->id)
            ->latest()
            ->paginate(20);

        return response()->json($rooms);
    }

    private function generateLiveKitToken($user, CallRoom $room): string
    {
        return $this->encodeJWT([
            'iss' => config('livestream.livekit.api_key'),
            'sub' => config('livestream.livekit.api_key'),
            'aud' => 'livekit',
            'iat' => time(),
            'exp' => time() + 3600,
            'nbf' => time(),
            'jti' => $room->room_sid . '-' . $user->id . '-' . time(),
            'video' => [
                'room' => $room->room_sid,
                'roomJoin' => true,
                'roomList' => true,
                'roomRecord' => false,
                'roomCreate' => false,
                'canPublish' => true,
                'canSubscribe' => true,
                'canPublishData' => true,
                'canUpdateOwnMetadata' => true,
                'agent' => true,
                'ingressAdmin' => false,
            ],
            'name' => $user->name,
            'identity' => (string) $user->id,
            'metadata' => json_encode([
                'user_id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->avatar ?? '',
            ]),
        ], config('livestream.livekit.api_secret'));
    }

    private function generateAdminToken(): string
    {
        return $this->encodeJWT([
            'iss' => config('livestream.livekit.api_key'),
            'sub' => config('livestream.livekit.api_key'),
            'aud' => 'livekit',
            'iat' => time(),
            'exp' => time() + 300,
            'video' => [
                'roomCreate' => true,
                'roomList' => true,
                'roomAdmin' => true,
            ],
        ], config('livestream.livekit.api_secret'));
    }

    private function encodeJWT(array $payload, string $secret): string
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

    private function createLiveKitRoom(CallRoom $room): void
    {
        $apiUrl = config('livestream.livekit.host');
        if (!$apiUrl) {
            return;
        }

        try {
            $token = $this->generateAdminToken();
            Http::withToken($token)
                ->timeout(5)
                ->post("{$apiUrl}/twirp/livekit.RoomService/CreateRoom", [
                    'name' => $room->room_sid,
                    'max_participants' => $room->max_participants ?? 50,
                    'empty_timeout' => 300,
                ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('LiveKit create room failed', [
                'room' => $room->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
