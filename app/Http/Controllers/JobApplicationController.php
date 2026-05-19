<?php

namespace App\Http\Controllers;

use App\Models\Job;
use App\Models\JobApplication;
use App\Services\FileUploadService;
use App\Services\GamificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobApplicationController extends Controller
{
    public function apply(Request $request, Job $job): JsonResponse
    {
        if ($job->status !== 'published') {
            return response()->json(['message' => 'This job is not accepting applications.'], 422);
        }

        if ($job->deadline && $job->deadline->isPast()) {
            return response()->json(['message' => 'Application deadline has passed.'], 422);
        }

        if ($job->max_applications > 0) {
            $count = $job->applications()->count();
            if ($count >= $job->max_applications) {
                return response()->json(['message' => 'Maximum number of applications reached.'], 422);
            }
        }

        $existing = $job->applications()->where('user_id', $request->user()->id)->first();
        if ($existing) {
            return response()->json(['message' => 'You have already applied for this job.', 'application' => $existing], 422);
        }

        $data = $request->validate([
            'cover_letter' => ['nullable', 'string', 'max:5000'],
            'resume' => ['nullable', 'file', 'mimes:pdf,doc,docx,txt', 'max:10240'],
        ]);

        $applicationData = [
            'job_id' => $job->id,
            'user_id' => $request->user()->id,
            'status' => 'pending',
            'cover_letter' => $data['cover_letter'] ?? null,
        ];

        if ($request->hasFile('resume')) {
            $upload = FileUploadService::upload($request->file('resume'), 'resumes');
            if ($upload) {
                $applicationData['resume_url'] = $upload['url'];
            }
        }

        $application = JobApplication::create($applicationData);
        $application->load('job:id,title,company_id', 'job.company:id,name');

        app(GamificationService::class)->awardPoints($request->user(), 'job_applied');

        return response()->json($application, 201);
    }

    public function myApplications(Request $request): JsonResponse
    {
        $applications = JobApplication::query()
            ->with(['job' => function ($query) {
                $query->with('company:id,name,slug,logo');
            }])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return response()->json($applications);
    }

    public function index(Request $request, Job $job): JsonResponse
    {
        $user = $request->user();
        if ($job->created_by !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $query = $job->applications()
            ->with('user:id,name,email,round,batch')
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->paginate(20));
    }

    public function updateStatus(Request $request, JobApplication $application): JsonResponse
    {
        $user = $request->user();
        $job = $application->job;

        if (!$job) {
            return response()->json(['message' => 'Job not found.'], 404);
        }

        if ($job->created_by !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'status' => ['required', 'string', 'in:pending,reviewed,shortlisted,rejected,accepted'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $application->update($data);
        $application->load('user:id,name,email,round,batch');

        return response()->json($application);
    }
}
