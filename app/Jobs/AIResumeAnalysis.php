<?php

namespace App\Jobs;

use App\Models\AuditLog;
use App\Models\User;
use App\Services\OllamaService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AIResumeAnalysis implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $userId;

    public int $timeout = 180;

    public function __construct(int $userId)
    {
        $this->userId = $userId;
    }

    public function handle(OllamaService $ollama): void
    {
        $user = User::query()->with('userProfile')->find($this->userId);

        if (!$user || !$user->userProfile) {
            Log::warning("AIResumeAnalysis: User #{$this->userId} or profile not found");
            return;
        }

        $profile = $user->userProfile;

        $bio = $user->bio ?? '';
        $experienceText = '';
        if (is_array($profile->experience)) {
            $parts = [];
            foreach ($profile->experience as $exp) {
                $parts[] = ($exp['role'] ?? '') . ' at ' . ($exp['company'] ?? '') . ' (' . ($exp['start_date'] ?? '') . ' - ' . ($exp['end_date'] ?? '') . ')';
            }
            $experienceText = implode('; ', $parts);
        }

        $certText = '';
        if (is_array($profile->certifications)) {
            $certText = implode(', ', $profile->certifications);
        }

        $projectText = '';
        if (is_array($profile->projects)) {
            $projParts = [];
            foreach ($profile->projects as $proj) {
                $projParts[] = is_string($proj) ? $proj : ($proj['title'] ?? '');
            }
            $projectText = implode(', ', $projParts);
        }

        $existingSkills = is_array($profile->skills) ? $profile->skills : [];

        $profileData = implode("\n", array_filter([
            "Bio: {$bio}",
            $experienceText ? "Experience: {$experienceText}" : null,
            $certText ? "Certifications: {$certText}" : null,
            $projectText ? "Projects: {$projectText}" : null,
            $existingSkills ? "Current skills: " . implode(', ', $existingSkills) : null,
        ]));

        if (empty(trim($profileData))) {
            Log::warning("AIResumeAnalysis: User #{$this->userId} has no profile data");
            return;
        }

        $prompt = "Analyze this professional profile and extract structured skills. Respond with JSON only: {\"extracted_skills\": [\"skill1\", \"skill2\"], \"suggested_skills\": [\"skill3\"], \"career_level\": \"entry|mid|senior\", \"top_industries\": [\"industry1\"]}\n\nProfile:\n{$profileData}";

        try {
            $response = $ollama->generate($prompt, [
                'temperature' => 0.1,
                'max_tokens' => 512,
            ]);

            $result = $this->parseResponse($response);

            if (!empty($result['extracted_skills']) || !empty($result['suggested_skills'])) {
                $allSkills = array_merge($existingSkills, $result['extracted_skills'] ?? [], $result['suggested_skills'] ?? []);
                $mergedSkills = array_values(array_unique(array_map('trim', array_filter($allSkills))));

                $profile->update([
                    'skills' => $mergedSkills,
                ]);
            }

            AuditLog::log(
                $user,
                'ai.resume_analysis',
                'user_profile',
                $profile->id,
                [
                    'extracted_skills' => $result['extracted_skills'] ?? [],
                    'suggested_skills' => $result['suggested_skills'] ?? [],
                    'career_level' => $result['career_level'] ?? null,
                    'top_industries' => $result['top_industries'] ?? [],
                    'previous_skills' => $existingSkills,
                ]
            );
        } catch (\Exception $e) {
            Log::error("AIResumeAnalysis failed for user #{$this->userId}", [
                'error' => $e->getMessage(),
            ]);
        }
    }

    protected function parseResponse(string $response): array
    {
        $response = trim($response);

        $json = null;
        if (str_starts_with($response, '{')) {
            $json = json_decode($response, true);
        }

        if (!$json) {
            preg_match('/\{[^{}]*\}/', $response, $matches);
            if (!empty($matches)) {
                $json = json_decode($matches[0], true);
            }
        }

        if (!$json) {
            return [
                'extracted_skills' => [],
                'suggested_skills' => [],
                'career_level' => null,
                'top_industries' => [],
            ];
        }

        return [
            'extracted_skills' => $json['extracted_skills'] ?? [],
            'suggested_skills' => $json['suggested_skills'] ?? [],
            'career_level' => $json['career_level'] ?? null,
            'top_industries' => $json['top_industries'] ?? [],
        ];
    }
}
