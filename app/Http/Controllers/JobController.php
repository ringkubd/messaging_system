<?php

namespace App\Http\Controllers;

use App\Models\Job;
use App\Models\UserProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JobController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Job::query()
            ->with('company:id,name,slug,logo,industry,location')
            ->with('creator:id,name')
            ->withCount('applications')
            ->latest();

        $query->where('status', 'published');

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('company_id')) {
            $query->where('company_id', (int) $request->input('company_id'));
        }

        if ($request->filled('location')) {
            $location = $request->input('location');
            $query->where('location', 'like', "%{$location}%");
        }

        if ($request->filled('skills')) {
            $skills = $request->input('skills');
            if (is_string($skills)) {
                $skills = explode(',', $skills);
            }
            foreach ((array) $skills as $skill) {
                $query->where('skills_required', 'like', "%{$skill}%");
            }
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $sort = $request->input('sort', 'date');
        if ($sort === 'salary') {
            $query->orderByRaw('CAST(salary_range AS UNSIGNED) DESC');
        } else {
            $query->latest('created_at');
        }

        return response()->json($query->paginate(12));
    }

    public function show(Job $job): JsonResponse
    {
        $job->load('company', 'creator:id,name')
            ->loadCount('applications');

        $user = request()->user();
        if ($user) {
            $application = $job->applications()->where('user_id', $user->id)->first();
            $job->user_application = $application;
        }

        return response()->json($job);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'company_id' => ['required', 'integer', 'exists:companies,id'],
            'description' => ['required', 'string'],
            'type' => ['required', 'string', 'in:full_time,part_time,internship,contract,remote'],
            'location' => ['nullable', 'string', 'max:255'],
            'salary_range' => ['nullable', 'string', 'max:255'],
            'requirements' => ['nullable', 'string'],
            'responsibilities' => ['nullable', 'string'],
            'skills_required' => ['nullable', 'array'],
            'deadline' => ['nullable', 'date'],
            'max_applications' => ['nullable', 'integer', 'min:0'],
            'status' => ['sometimes', 'string', 'in:draft,published,closed,filled'],
        ]);

        $data['created_by'] = $request->user()->id;

        $job = Job::create($data);
        $job->load('company:id,name,slug,logo', 'creator:id,name');

        return response()->json($job, 201);
    }

    public function update(Request $request, Job $job): JsonResponse
    {
        $user = $request->user();
        if ($job->created_by !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'company_id' => ['sometimes', 'required', 'integer', 'exists:companies,id'],
            'description' => ['sometimes', 'required', 'string'],
            'type' => ['sometimes', 'required', 'string', 'in:full_time,part_time,internship,contract,remote'],
            'location' => ['nullable', 'string', 'max:255'],
            'salary_range' => ['nullable', 'string', 'max:255'],
            'requirements' => ['nullable', 'string'],
            'responsibilities' => ['nullable', 'string'],
            'skills_required' => ['nullable', 'array'],
            'deadline' => ['nullable', 'date'],
            'max_applications' => ['nullable', 'integer', 'min:0'],
            'status' => ['sometimes', 'string', 'in:draft,published,closed,filled'],
        ]);

        $job->update($data);
        $job->load('company:id,name,slug,logo', 'creator:id,name');

        return response()->json($job);
    }

    public function destroy(Request $request, Job $job): JsonResponse
    {
        $user = $request->user();
        if ($job->created_by !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $job->delete();

        return response()->json(['message' => 'Job deleted.']);
    }

    public function myJobs(Request $request): JsonResponse
    {
        $query = Job::query()
            ->with('company:id,name,slug,logo,industry,location')
            ->withCount('applications')
            ->where('created_by', $request->user()->id)
            ->latest();

        return response()->json($query->paginate(20));
    }

    public function matchingJobs(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = UserProfile::query()->where('user_id', $user->id)->first();

        $userSkills = [];
        if ($profile && is_array($profile->skills)) {
            $userSkills = array_map('strtolower', array_map('trim', $profile->skills));
        }

        $jobs = Job::query()
            ->with('company:id,name,slug,logo,industry,location')
            ->with('creator:id,name')
            ->withCount('applications')
            ->where('status', 'published')
            ->latest()
            ->get();

        $mapped = $jobs->map(function ($job) use ($userSkills) {
            $jobSkills = [];
            if (is_array($job->skills_required)) {
                $jobSkills = array_map('strtolower', array_map('trim', $job->skills_required));
            }

            $matchScore = 0;
            if (!empty($userSkills) && !empty($jobSkills)) {
                $intersection = array_intersect($userSkills, $jobSkills);
                $matchScore = (int) round((count($intersection) / count($jobSkills)) * 100);
            }

            $job->match_score = min($matchScore, 100);

            return $job;
        });

        $sorted = $mapped->sortByDesc('match_score')->values();

        return response()->json($sorted);
    }
}
