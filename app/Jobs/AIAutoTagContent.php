<?php

namespace App\Jobs;

use App\Models\Post;
use App\Models\Resource;
use App\Services\OllamaService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AIAutoTagContent implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $contentType;

    public int $contentId;

    public int $timeout = 180;

    public function __construct(string $contentType, int $contentId)
    {
        $this->contentType = $contentType;
        $this->contentId = $contentId;
    }

    public function handle(OllamaService $ollama): void
    {
        try {
            if ($this->contentType === 'post') {
                $this->processPost($ollama);
            } elseif ($this->contentType === 'resource') {
                $this->processResource($ollama);
            }
        } catch (\Exception $e) {
            Log::error('AIAutoTagContent failed', [
                'content_type' => $this->contentType,
                'content_id' => $this->contentId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    protected function processPost(OllamaService $ollama): void
    {
        $post = Post::query()->find($this->contentId);
        if (!$post || empty($post->body)) {
            return;
        }

        $text = strip_tags($post->body);
        $text = mb_substr($text, 0, 2000);

        $prompt = "Extract 3-5 relevant tags from this text. Respond with a JSON array of strings only, no other text. Text: \"{$text}\"";
        $response = $ollama->generate($prompt);
        $tags = json_decode($response, true);

        if (empty($tags) || !is_array($tags)) {
            return;
        }

        $existingTags = $post->tags ?? [];
        $merged = array_values(array_unique(array_merge(
            is_array($existingTags) ? $existingTags : [],
            $tags
        )));

        $post->update(['tags' => $merged]);
    }

    protected function processResource(OllamaService $ollama): void
    {
        $resource = Resource::query()->find($this->contentId);
        if (!$resource) {
            return;
        }

        $title = mb_substr($resource->title, 0, 500);
        $description = $resource->description ? mb_substr(strip_tags($resource->description), 0, 1500) : '';

        $prompt = "Categorize this content and extract up to 5 tags. Respond with JSON only: {\"category\": \"string\", \"tags\": [\"tag1\", \"tag2\"]}. Title: \"{$title}\". Description: \"{$description}\"";
        $response = $ollama->generate($prompt);
        $result = json_decode($response, true);

        if (empty($result) || !is_array($result)) {
            return;
        }

        $updates = [];

        if (!empty($result['tags']) && is_array($result['tags'])) {
            $existingTags = $resource->tags ?? [];
            $merged = array_values(array_unique(array_merge(
                is_array($existingTags) ? $existingTags : [],
                $result['tags']
            )));
            $updates['tags'] = $merged;
        }

        if (!empty($result['category'])) {
            $updates['ai_category'] = $result['category'];
        }

        if (!empty($updates)) {
            $resource->update($updates);
        }
    }
}
