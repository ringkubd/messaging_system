<?php

namespace App\Http\Controllers;

use App\Models\SuccessStory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuccessStoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $stories = SuccessStory::query()
            ->approved()
            ->whereNotNull('published_at')
            ->with('user:id,name,email,round,batch,course,avatar')
            ->latest('published_at')
            ->paginate(20);

        return response()->json($stories);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'story' => ['required', 'string'],
            'company' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'string', 'max:255'],
        ]);

        $story = SuccessStory::create([
            'user_id' => $request->user()->id,
            'title' => $data['title'],
            'story' => $data['story'],
            'company' => $data['company'] ?? null,
            'position' => $data['position'] ?? null,
            'image' => $data['image'] ?? null,
        ]);

        return response()->json(
            $story->load('user:id,name,email,round,batch,course,avatar'),
            201
        );
    }

    public function update(Request $request, SuccessStory $successStory): JsonResponse
    {
        abort_unless($successStory->user_id === $request->user()->id, 403, 'You can only edit your own story.');

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'story' => ['sometimes', 'string'],
            'company' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'string', 'max:255'],
        ]);

        $successStory->update($data);

        return response()->json($successStory->fresh()->load('user:id,name,email,round,batch,course,avatar'));
    }

    public function destroy(Request $request, SuccessStory $successStory): JsonResponse
    {
        abort_unless($successStory->user_id === $request->user()->id, 403, 'You can only delete your own story.');

        $successStory->delete();

        return response()->json(['message' => 'Story deleted.']);
    }
}
