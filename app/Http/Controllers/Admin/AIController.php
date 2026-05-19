<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Resource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    public function tagSuggestions(): JsonResponse
    {
        $resources = Resource::query()
            ->whereNotNull('ai_category')
            ->where('ai_category_approved', false)
            ->with('user:id,name')
            ->latest()
            ->paginate(20);

        return response()->json($resources);
    }

    public function approveCategory(Request $request, Resource $resource): JsonResponse
    {
        $data = $request->validate([
            'approved' => ['required', 'boolean'],
        ]);

        $resource->update([
            'ai_category_approved' => $data['approved'],
        ]);

        return response()->json([
            'message' => $data['approved']
                ? 'Category suggestion approved.'
                : 'Category suggestion rejected.',
            'resource' => $resource->fresh()->load('user:id,name', 'category:id,name,icon'),
        ]);
    }
}
