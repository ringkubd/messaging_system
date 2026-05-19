<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    public function indexMine(Request $request): JsonResponse
    {
        $reports = Report::query()
            ->where('reporter_id', $request->user()->id)
            ->with(['target', 'reviewer:id,name,email'])
            ->latest('id')
            ->paginate(20);

        return response()->json($reports);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Report::class);

        $data = $request->validate([
            'target_type' => ['required', Rule::in(['post', 'comment'])],
            'target_id' => ['required', 'integer'],
            'reason' => ['required', 'string', 'max:120'],
            'details' => ['nullable', 'string', 'max:2000'],
        ]);

        $target = $this->resolveTarget($data['target_type'], (int) $data['target_id']);
        abort_if($target === null, 422, 'Target not found.');

        $report = Report::query()->updateOrCreate(
            [
                'reporter_id' => $request->user()->id,
                'target_type' => $target->getMorphClass(),
                'target_id' => $target->id,
            ],
            [
                'reason' => $data['reason'],
                'details' => $data['details'] ?? null,
                'status' => Report::STATUS_PENDING,
                'reviewed_by' => null,
                'reviewed_at' => null,
            ]
        );

        return response()->json($report->load('target'), 201);
    }

    public function queue(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Report::class);

        $reports = Report::query()
            ->where('status', Report::STATUS_PENDING)
            ->with(['reporter:id,name,email', 'target'])
            ->latest('id')
            ->paginate(30);

        return response()->json($reports);
    }

    public function resolve(Request $request, Report $report): JsonResponse
    {
        $this->authorize('review', Report::class);

        $data = $request->validate([
            'status' => ['required', Rule::in([Report::STATUS_REVIEWED, Report::STATUS_REJECTED])],
        ]);

        $report->update([
            'status' => $data['status'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json($report->fresh()->load(['reporter:id,name,email', 'reviewer:id,name,email', 'target']));
    }

    private function resolveTarget(string $type, int $id): Post|Comment|null
    {
        return match ($type) {
            'post' => Post::query()->find($id),
            'comment' => Comment::query()->find($id),
            default => null,
        };
    }
}
