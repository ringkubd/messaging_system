<?php

namespace App\Support;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class Idempotency
{
    public static function rememberJsonResponse(Request $request, string $action, Closure $callback, int $ttlSeconds = 600): JsonResponse
    {
        $idempotencyKey = trim((string) $request->header('X-Idempotency-Key', ''));
        $userId = $request->user()?->id;

        if ($idempotencyKey === '' || ! $userId) {
            return $callback();
        }

        $cacheKey = sprintf('idempotency:%s:user:%s:key:%s', $action, $userId, $idempotencyKey);
        $cached = Cache::get($cacheKey);

        if (is_array($cached) && array_key_exists('body', $cached) && array_key_exists('status', $cached)) {
            return response()->json($cached['body'], (int) $cached['status']);
        }

        $response = $callback();

        if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 300) {
            Cache::put($cacheKey, [
                'body' => $response->getData(true),
                'status' => $response->getStatusCode(),
            ], now()->addSeconds($ttlSeconds));
        }

        return $response;
    }
}
