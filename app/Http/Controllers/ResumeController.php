<?php

namespace App\Http\Controllers;

use App\Jobs\AIResumeAnalysis;
use App\Models\AuditLog;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResumeController extends Controller
{
    public function analyze(Request $request): JsonResponse
    {
        $request->validate([
            'resume' => ['nullable', 'file', 'mimes:pdf,doc,docx,txt', 'max:10240'],
        ]);

        $user = $request->user();

        if ($request->hasFile('resume')) {
            $uploaded = FileUploadService::upload($request->file('resume'), 'resumes');

            AuditLog::log(
                $user,
                'resume.uploaded',
                'resume',
                $user->id,
                ['file_url' => $uploaded['url'] ?? null]
            );
        }

        AIResumeAnalysis::dispatch($user->id);

        return response()->json([
            'message' => 'Resume analysis started. Skills will be updated shortly.',
        ]);
    }

    public function suggestions(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->userProfile;

        if (!$profile || empty($profile->skills)) {
            return response()->json([
                'suggested_skills' => [],
                'career_level' => null,
                'top_industries' => [],
            ]);
        }

        $auditLog = AuditLog::query()
            ->where('user_id', $user->id)
            ->where('action', 'ai.resume_analysis')
            ->latest()
            ->first();

        if (!$auditLog || !$auditLog->metadata) {
            return response()->json([
                'suggested_skills' => [],
                'career_level' => null,
                'top_industries' => [],
            ]);
        }

        return response()->json([
            'suggested_skills' => $auditLog->metadata['suggested_skills'] ?? [],
            'career_level' => $auditLog->metadata['career_level'] ?? null,
            'top_industries' => $auditLog->metadata['top_industries'] ?? [],
            'extracted_skills' => $auditLog->metadata['extracted_skills'] ?? [],
        ]);
    }

    public function acceptSuggestions(Request $request): JsonResponse
    {
        $data = $request->validate([
            'skills' => ['required', 'array'],
            'skills.*' => ['string', 'max:100'],
        ]);

        $user = $request->user();
        $profile = $user->userProfile;

        $existingSkills = is_array($profile->skills) ? $profile->skills : [];
        $newSkills = $data['skills'];

        $merged = array_values(array_unique(array_merge($existingSkills, $newSkills)));

        $profile->update(['skills' => $merged]);

        return response()->json([
            'message' => 'Skills updated.',
            'skills' => $merged,
        ]);
    }
}
