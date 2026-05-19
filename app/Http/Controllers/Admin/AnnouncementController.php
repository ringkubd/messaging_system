<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Announcement::query()->with('createdBy:id,name');

        if ($search = $request->get('search')) {
            $query->where('title', 'like', "%{$search}%");
        }

        if ($type = $request->get('type')) {
            $query->ofType($type);
        }

        if ($status = $request->get('status')) {
            match ($status) {
                'published' => $query->published(),
                'draft' => $query->draft(),
                default => null,
            };
        }

        return response()->json($query->latest('id')->paginate($request->integer('per_page', 20)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'type' => ['required', Rule::in(['notice', 'announcement', 'news', 'event_banner'])],
            'audience' => ['required', Rule::in(['all', 'students', 'alumni', 'trainers'])],
            'is_pinned' => ['boolean'],
            'banner_image' => ['nullable', 'string', 'max:2048'],
            'publish_now' => ['boolean'],
        ]);

        $announcement = Announcement::create([
            'title' => $data['title'],
            'body' => $data['body'],
            'type' => $data['type'],
            'audience' => $data['audience'],
            'is_pinned' => $data['is_pinned'] ?? false,
            'banner_image' => $data['banner_image'] ?? null,
            'published_at' => !empty($data['publish_now']) ? now() : null,
            'created_by' => $request->user()->id,
        ]);

        $announcement->load('createdBy:id,name');

        return response()->json($announcement, 201);
    }

    public function show(Announcement $announcement): JsonResponse
    {
        return response()->json($announcement->load('createdBy:id,name'));
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'body' => ['sometimes', 'required', 'string'],
            'type' => ['sometimes', 'required', Rule::in(['notice', 'announcement', 'news', 'event_banner'])],
            'audience' => ['sometimes', 'required', Rule::in(['all', 'students', 'alumni', 'trainers'])],
            'is_pinned' => ['boolean'],
            'banner_image' => ['nullable', 'string', 'max:2048'],
        ]);

        $announcement->update($data);

        return response()->json($announcement->fresh()->load('createdBy:id,name'));
    }

    public function destroy(Request $request, Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        AuditLog::log(
            $request->user(),
            'announcement.deleted',
            'announcement',
            $announcement->id,
            ['title' => $announcement->title]
        );

        return response()->json(['message' => 'Announcement deleted.']);
    }

    public function togglePin(Request $request, Announcement $announcement): JsonResponse
    {
        $announcement->update(['is_pinned' => !$announcement->is_pinned]);

        AuditLog::log(
            $request->user(),
            $announcement->is_pinned ? 'announcement.pinned' : 'announcement.unpinned',
            'announcement',
            $announcement->id,
            ['title' => $announcement->title]
        );

        return response()->json($announcement->fresh());
    }

    public function publish(Request $request, Announcement $announcement): JsonResponse
    {
        if ($announcement->published_at) {
            $announcement->update(['published_at' => null]);

            AuditLog::log(
                $request->user(),
                'announcement.unpublished',
                'announcement',
                $announcement->id,
                ['title' => $announcement->title]
            );

            return response()->json(['message' => 'Announcement unpublished.', 'announcement' => $announcement->fresh()->load('createdBy:id,name')]);
        }

        $announcement->update(['published_at' => now()]);

        AuditLog::log(
            $request->user(),
            'announcement.published',
            'announcement',
            $announcement->id,
            ['title' => $announcement->title]
        );

        return response()->json(['message' => 'Announcement published.', 'announcement' => $announcement->fresh()->load('createdBy:id,name')]);
    }
}
