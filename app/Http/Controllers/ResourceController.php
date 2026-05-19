<?php

namespace App\Http\Controllers;

use App\Jobs\AIAutoTagContent;
use App\Models\Resource;
use App\Models\ResourceCategory;
use App\Models\ResourceRating;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResourceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Resource::query()
            ->with('user:id,name')
            ->withCount('ratings')
            ->published()
            ->latest();

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->filled('type')) {
            $query->ofType($request->input('type'));
        }

        if ($request->filled('search')) {
            $query->search($request->input('search'));
        }

        $perPage = min((int) $request->input('per_page', 20), 50);
        return response()->json($query->paginate($perPage));
    }

    public function show(Resource $resource): JsonResponse
    {
        $resource->load('user:id,name', 'category:id,name,icon')
            ->loadCount('ratings');

        return response()->json($resource);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'string', 'in:pdf,video,document,ebook,source_code,template,other'],
            'category_id' => ['nullable', 'exists:resource_categories,id'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $upload = FileUploadService::upload($request->file('file'), 'resources');
        if (!$upload) {
            return response()->json(['message' => 'File upload failed.'], 422);
        }

        $data['file_url'] = $upload['url'];
        $data['file_size'] = $upload['size'];
        $data['file_type'] = $upload['mime'];
        $data['user_id'] = $request->user()->id;
        $data['tags'] = $request->has('tags') ? $request->input('tags') : null;

        $resource = Resource::create($data);
        $resource->load('user:id,name', 'category:id,name,icon');

        AIAutoTagContent::dispatch('resource', $resource->id);

        return response()->json($resource, 201);
    }

    public function update(Request $request, Resource $resource): JsonResponse
    {
        if ($resource->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['sometimes', 'required', 'string', 'in:pdf,video,document,ebook,source_code,template,other'],
            'category_id' => ['nullable', 'exists:resource_categories,id'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'file' => ['nullable', 'file', 'max:10240'],
            'status' => ['sometimes', 'required', 'string', 'in:draft,published'],
        ]);

        if ($request->hasFile('file')) {
            $upload = FileUploadService::upload($request->file('file'), 'resources');
            if ($upload) {
                $data['file_url'] = $upload['url'];
                $data['file_size'] = $upload['size'];
                $data['file_type'] = $upload['mime'];
            }
        }

        if ($request->has('tags')) {
            $data['tags'] = $request->input('tags');
        }

        $resource->update($data);
        $resource->load('user:id,name', 'category:id,name,icon');

        return response()->json($resource);
    }

    public function destroy(Request $request, Resource $resource): JsonResponse
    {
        if ($resource->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $resource->delete();

        return response()->json(['message' => 'Resource deleted.']);
    }

    public function download(Request $request, Resource $resource): JsonResponse
    {
        $resource->increment('download_count');

        return response()->json([
            'url' => $resource->file_url,
            'title' => $resource->title,
        ]);
    }

    public function rate(Request $request, Resource $resource): JsonResponse
    {
        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        ResourceRating::updateOrCreate(
            [
                'resource_id' => $resource->id,
                'user_id' => $request->user()->id,
            ],
            ['rating' => $data['rating']]
        );

        $avg = (float) ResourceRating::where('resource_id', $resource->id)->avg('rating');
        $count = ResourceRating::where('resource_id', $resource->id)->count();
        $resource->update([
            'avg_rating' => round($avg, 2),
            'ratings_count' => $count,
        ]);

        return response()->json([
            'avg_rating' => round($avg, 2),
            'ratings_count' => $count,
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = ResourceCategory::query()
            ->withCount('resources')
            ->orderBy('sort_order')
            ->get();

        return response()->json($categories);
    }
}
