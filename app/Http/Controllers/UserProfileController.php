<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->profile;

        return response()->json($profile);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'gender' => 'nullable|string|in:male,female,other',
            'date_of_birth' => 'nullable|date',
            'blood_group' => 'nullable|string|max:10',
            'linkedin_url' => 'nullable|url|max:500',
            'github_url' => 'nullable|url|max:500',
            'portfolio_url' => 'nullable|url|max:500',
            'experience' => 'nullable|array',
            'experience.*.company' => 'required_with:experience|string|max:255',
            'experience.*.role' => 'required_with:experience|string|max:255',
            'experience.*.start_date' => 'nullable|string|max:50',
            'experience.*.end_date' => 'nullable|string|max:50',
            'experience.*.description' => 'nullable|string|max:2000',
            'certifications' => 'nullable|array',
            'certifications.*.name' => 'required_with:certifications|string|max:255',
            'certifications.*.issuer' => 'nullable|string|max:255',
            'certifications.*.date' => 'nullable|string|max:50',
            'certifications.*.url' => 'nullable|url|max:500',
            'projects' => 'nullable|array',
            'projects.*.name' => 'required_with:projects|string|max:255',
            'projects.*.description' => 'nullable|string|max:2000',
            'projects.*.url' => 'nullable|url|max:500',
            'projects.*.technologies' => 'nullable|array',
            'projects.*.technologies.*' => 'string|max:100',
            'skills' => 'nullable|array',
            'skills.*' => 'string|max:100',
        ]);

        $profile = $request->user()->profile;
        $profile->update($validated);

        return response()->json($profile->fresh());
    }
}
