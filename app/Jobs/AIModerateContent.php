<?php

namespace App\Jobs;

use App\Models\AuditLog;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use App\Services\OllamaService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AIModerateContent implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $modelType;

    public int $modelId;

    public int $tries = 3;

    public function __construct(string $modelType, int $modelId)
    {
        $this->modelType = $modelType;
        $this->modelId = $modelId;
    }

    public function handle(OllamaService $ollama): void
    {
        $model = $this->resolveModel();
        if (!$model) {
            Log::warning("AIModerateContent: {$this->modelType}#{$this->modelId} not found");

            return;
        }

        $contentText = $this->getContentText($model);
        if (empty(trim($contentText))) {
            $model->update([
                'moderation_status' => 'approved',
                'moderated_at' => now(),
            ]);

            return;
        }

        $prompt = "Analyze this text for toxicity, spam, harassment, hate speech, NSFW content. Respond with JSON: {'is_flagged': bool, 'reason': string|null, 'categories': []}\n\nText: {$contentText}";

        try {
            $response = $ollama->generate($prompt, [
                'temperature' => 0.1,
                'max_tokens' => 256,
            ]);

            $result = $this->parseResponse($response);

            if ($result['is_flagged']) {
                $model->update([
                    'moderation_status' => 'flagged',
                    'moderation_reason' => $result['reason'],
                    'moderated_at' => now(),
                ]);

                $this->logModeration($model, 'flagged', $result['reason'], $result['categories']);
            } else {
                $model->update([
                    'moderation_status' => 'approved',
                    'moderated_at' => now(),
                ]);

                $this->logModeration($model, 'approved', null, []);
            }
        } catch (\Exception $e) {
            Log::error("AIModerateContent failed for {$this->modelType}#{$this->modelId}", [
                'error' => $e->getMessage(),
            ]);

            $model->update([
                'moderation_status' => 'approved',
                'moderated_at' => now(),
            ]);
        }
    }

    protected function resolveModel(): Post|Comment|null
    {
        return match ($this->modelType) {
            'post' => Post::query()->find($this->modelId),
            'comment' => Comment::query()->find($this->modelId),
            default => null,
        };
    }

    protected function getContentText(Post|Comment $model): string
    {
        return $model->body ?? '';
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

        if (!$json || !isset($json['is_flagged'])) {
            return ['is_flagged' => false, 'reason' => null, 'categories' => []];
        }

        return [
            'is_flagged' => (bool) $json['is_flagged'],
            'reason' => $json['reason'] ?? null,
            'categories' => $json['categories'] ?? [],
        ];
    }

    protected function logModeration(Post|Comment $model, string $status, ?string $reason, array $categories): void
    {
        $actor = User::query()->where('role', 'super_admin')->first();

        if ($actor) {
            AuditLog::log(
                $actor,
                'moderation.' . $status,
                $this->modelType === 'post' ? 'post' : 'comment',
                $model->id,
                [
                    'moderation_status' => $status,
                    'reason' => $reason,
                    'categories' => $categories,
                    'model_type' => $this->modelType,
                ]
            );
        }
    }
}
