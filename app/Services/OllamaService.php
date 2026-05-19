<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaService
{
    protected string $baseUrl;

    protected string $model;

    protected int $timeout;

    public function __construct()
    {
        $this->baseUrl = config('ollama.base_url');
        $this->model = config('ollama.model');
        $this->timeout = (int) config('ollama.timeout', 30);
    }

    public function generate(string $prompt, array $options = []): string
    {
        $payload = array_merge([
            'model' => $this->model,
            'prompt' => $prompt,
            'stream' => false,
        ], $options);

        try {
            $response = Http::connectTimeout(1)->timeout($this->timeout)
                ->post("{$this->baseUrl}/api/generate", $payload);

            $response->throw();

            $data = $response->json();

            return $data['response'] ?? '';
        } catch (RequestException|ConnectionException $e) {
            Log::error('Ollama generate failed', [
                'error' => $e->getMessage(),
                'prompt' => substr($prompt, 0, 200),
            ]);

            throw $e;
        }
    }

    public function embed(string $text): array
    {
        try {
            $response = Http::connectTimeout(1)->timeout($this->timeout)
                ->post("{$this->baseUrl}/api/embeddings", [
                    'model' => $this->model,
                    'prompt' => $text,
                ]);

            $response->throw();

            return $response->json()['embedding'] ?? [];
        } catch (RequestException|ConnectionException $e) {
            Log::error('Ollama embed failed', [
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
