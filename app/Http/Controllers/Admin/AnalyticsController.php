<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Models\UserProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function skillGaps(): JsonResponse
    {
        $studentSkills = UserProfile::query()
            ->whereHas('user', function ($q) {
                $q->where('role', 'user');
            })
            ->whereNotNull('skills')
            ->get()
            ->pluck('skills')
            ->filter()
            ->flatten()
            ->map(fn ($s) => strtolower(trim($s)))
            ->filter()
            ->values();

        $studentSkillCounts = $studentSkills->countBy()->sortDesc();

        $jobSkills = Job::query()
            ->where('status', 'published')
            ->whereNotNull('skills_required')
            ->get()
            ->pluck('skills_required')
            ->filter()
            ->flatten()
            ->map(fn ($s) => strtolower(trim($s)))
            ->filter()
            ->values();

        $jobSkillCounts = $jobSkills->countBy()->sortDesc();

        $allSkills = $studentSkillCounts->keys()->merge($jobSkillCounts->keys())->unique()->sort();

        $skillGaps = [];
        foreach ($allSkills as $skill) {
            $demand = $jobSkillCounts->get($skill, 0);
            $supply = $studentSkillCounts->get($skill, 0);

            if ($demand > 0) {
                $skillGaps[] = [
                    'skill' => ucfirst($skill),
                    'demand' => $demand,
                    'supply' => $supply,
                    'gap' => $demand - $supply,
                ];
            }
        }

        usort($skillGaps, fn ($a, $b) => $b['gap'] <=> $a['gap']);

        $topInDemand = $jobSkillCounts->take(20)->map(function ($count, $skill) {
            return ['skill' => ucfirst($skill), 'count' => $count];
        })->values();

        $topAvailable = $studentSkillCounts->take(20)->map(function ($count, $skill) {
            return ['skill' => ucfirst($skill), 'count' => $count];
        })->values();

        return response()->json([
            'skill_gaps' => array_slice($skillGaps, 0, 50),
            'top_in_demand' => $topInDemand,
            'top_available' => $topAvailable,
        ]);
    }
}
