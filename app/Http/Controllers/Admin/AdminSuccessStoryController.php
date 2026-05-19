<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SuccessStory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSuccessStoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $stories = SuccessStory::query()
            ->when($request->filled('status'), function ($q) use ($request) {
                $status = $request->input('status');
                if ($status === 'approved') {
                    $q->where('is_approved', true);
                } elseif ($status === 'pending') {
                    $q->where('is_approved', false);
                }
            })
            ->with(['user:id,name,email', 'approver:id,name'])
            ->latest('id')
            ->paginate(20);

        return response()->json($stories);
    }

    public function approve(Request $request, SuccessStory $successStory): JsonResponse
    {
        $data = $request->validate([
            'is_approved' => ['required', 'boolean'],
        ]);

        $successStory->update([
            'is_approved' => $data['is_approved'],
            'approved_by' => $request->user()->id,
            'published_at' => $data['is_approved'] ? now() : null,
        ]);

        return response()->json(
            $successStory->fresh()->load(['user:id,name,email', 'approver:id,name'])
        );
    }
}
