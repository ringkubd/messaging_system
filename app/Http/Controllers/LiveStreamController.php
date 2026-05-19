<?php

namespace App\Http\Controllers;

use App\Models\LiveStream;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
}
