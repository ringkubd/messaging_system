<?php

namespace App\Http\Controllers;

use App\Models\Community;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CommunityController extends Controller
{
    public function index(): JsonResponse
    {
        $communities = Community::query()
            ->withCount('members')
            ->latest('id')
            ->paginate(20);

        return response()->json($communities);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Community::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_private' => ['nullable', 'boolean'],
        ]);

        $community = DB::transaction(function () use ($request, $data) {
            $baseSlug = Str::slug($data['name']);
            $slug = $baseSlug;
            $counter = 1;

            while (Community::query()->where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }

            $community = Community::create([
                'name' => $data['name'],
                'slug' => $slug,
                'description' => $data['description'] ?? null,
                'owner_id' => $request->user()->id,
                'is_private' => $data['is_private'] ?? false,
            ]);

            $community->members()->attach([
                $request->user()->id => ['role' => 'owner', 'joined_at' => now()],
            ]);

            return $community;
        });

        return response()->json($community->load('owner:id,name,email'), 201);
    }

    public function show(Community $community): JsonResponse
    {
        $this->authorize('view', $community);

        return response()->json($community->load(['owner:id,name,email', 'members:id,name,email']));
    }

    public function join(Request $request, Community $community): JsonResponse
    {
        $this->authorize('join', $community);

        $community->members()->syncWithoutDetaching([
            $request->user()->id => ['role' => 'member', 'joined_at' => now()],
        ]);

        return response()->json(['status' => 'ok']);
    }
}
