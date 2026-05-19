<?php

namespace App\Http\Controllers;

use App\Models\MentorshipRequest;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MentorshipController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $requests = MentorshipRequest::query()
            ->where(function ($query) use ($user) {
                $query->where('mentor_id', $user->id)
                    ->orWhere('mentee_id', $user->id);
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->with([
                'mentor:id,name,email,round,batch,course,avatar',
                'mentee:id,name,email,round,batch,course,avatar',
            ])
            ->latest('id')
            ->paginate(20);

        return response()->json($requests);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mentor_id' => ['required', 'integer', 'exists:users,id', Rule::notIn([$request->user()->id])],
            'message' => ['required', 'string', 'max:1000'],
        ]);

        $menteeId = $request->user()->id;
        $mentorId = (int) $data['mentor_id'];

        $existing = MentorshipRequest::query()
            ->where(function ($query) use ($mentorId, $menteeId) {
                $query->where('mentor_id', $mentorId)->where('mentee_id', $menteeId);
            })
            ->orWhere(function ($query) use ($mentorId, $menteeId) {
                $query->where('mentor_id', $menteeId)->where('mentee_id', $mentorId);
            })
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'A mentorship request already exists between these users.',
                'mentorship_request' => $existing,
            ], 422);
        }

        $requestModel = MentorshipRequest::create([
            'mentor_id' => $mentorId,
            'mentee_id' => $menteeId,
            'message' => $data['message'],
            'status' => MentorshipRequest::STATUS_PENDING,
        ]);

        return response()->json(
            $requestModel->load(['mentor:id,name,email,round,batch,course,avatar', 'mentee:id,name,email,round,batch,course,avatar']),
            201
        );
    }

    public function respond(Request $request, MentorshipRequest $mentorshipRequest): JsonResponse
    {
        $user = $request->user();

        abort_unless(
            $mentorshipRequest->mentor_id === $user->id,
            403,
            'Only the mentor can respond to this request.'
        );

        abort_unless(
            $mentorshipRequest->status === MentorshipRequest::STATUS_PENDING,
            422,
            'This request has already been responded to.'
        );

        $data = $request->validate([
            'status' => ['required', Rule::in([MentorshipRequest::STATUS_ACCEPTED, MentorshipRequest::STATUS_REJECTED])],
            'response_message' => ['nullable', 'string', 'max:1000'],
        ]);

        $mentorshipRequest->update([
            'status' => $data['status'],
            'response_message' => $data['response_message'] ?? null,
            'responded_at' => now(),
        ]);

        return response()->json(
            $mentorshipRequest->fresh()->load(['mentor:id,name,email,round,batch,course,avatar', 'mentee:id,name,email,round,batch,course,avatar'])
        );
    }

    public function mentors(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $batch = trim((string) $request->query('batch', ''));
        $course = trim((string) $request->query('course', ''));
        $userId = $request->user()->id;

        $mentors = User::query()
            ->select(['id', 'name', 'email', 'round', 'batch', 'course', 'avatar', 'bio'])
            ->where('id', '!=', $userId)
            ->where(function ($query) {
                $query->whereNotNull('round')
                    ->orWhereNotNull('batch');
            })
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                        ->orWhere('email', 'like', '%' . $search . '%');
                });
            })
            ->when($batch !== '', fn ($q) => $q->where('batch', $batch))
            ->when($course !== '', fn ($q) => $q->where('course', $course))
            ->with('userProfile:user_id,skills,experience')
            ->orderBy('name')
            ->paginate(20);

        return response()->json($mentors);
    }
}
