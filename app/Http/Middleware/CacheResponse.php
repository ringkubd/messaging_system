<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class CacheResponse
{
    protected array $skipPatterns = [
        'api/v1/me',
        'api/v1/profile',
        'api/v1/notifications',
        'api/v1/conversations',
        'api/v1/groups',
        'api/v1/chatbot',
    ];

    protected array $ttlConfig = [
        'api/v1/communities' => 300,
        'api/v1/institutions' => 300,
        'api/v1/scholarships' => 300,
        'api/v1/batches' => 300,
        'api/v1/companies' => 300,
        'api/v1/resource-categories' => 300,
        'api/v1/announcements/featured' => 300,
        'api/v1/jobs/matching' => 300,
    ];

    public function handle(Request $request, Closure $next, ?int $ttl = null): Response
    {
        if (! $request->isMethod('GET')) {
            return $next($request);
        }

        $path = $request->path();

        foreach ($this->skipPatterns as $pattern) {
            if (str_starts_with($path, $pattern)) {
                return $next($request);
            }
        }

        $ttl = $ttl ?? $this->resolveTtl($path);

        if ($ttl <= 0) {
            return $next($request);
        }

        $cacheKey = $this->buildCacheKey($request);

        if (Cache::has($cacheKey)) {
            $response = response(Cache::get($cacheKey), 200);
            $response->header('X-Cache', 'HIT');

            return $response;
        }

        $response = $next($request);

        if ($response->isSuccessful()) {
            Cache::put($cacheKey, $response->getContent(), now()->addSeconds($ttl));
        }

        $response->header('X-Cache', 'MISS');

        return $response;
    }

    protected function resolveTtl(string $path): int
    {
        foreach ($this->ttlConfig as $pattern => $ttl) {
            if (str_starts_with($path, $pattern)) {
                return $ttl;
            }
        }

        return 60;
    }

    protected function buildCacheKey(Request $request): string
    {
        $userId = $request->user()?->id ?? 'guest';
        $query = $request->getQueryString() ?? '';

        return 'response_cache:' . md5($request->path() . '?' . $query . '|user:' . $userId);
    }
}
