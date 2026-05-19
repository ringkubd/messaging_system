<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Response Caching
    |--------------------------------------------------------------------------
    |
    | Configure TTL (seconds) for response caching middleware.
    | Set to 0 to disable caching for a specific route pattern.
    |
    */

    'cache' => [
        'ttl' => [
            'feeds' => env('CACHE_TTL_FEEDS', 60),
            'reference_data' => env('CACHE_TTL_REFERENCE', 300),
            'search_results' => env('CACHE_TTL_SEARCH', 120),
        ],

        'skip_patterns' => [
            'api/v1/me',
            'api/v1/profile',
            'api/v1/notifications',
            'api/v1/conversations',
            'api/v1/groups',
            'api/v1/chatbot',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Image Optimization
    |--------------------------------------------------------------------------
    |
    | Server-side image processing settings.
    | Resize dimensions, quality, and format conversion.
    |
    */

    'image' => [
        'max_width' => env('IMAGE_MAX_WIDTH', 1920),
        'quality' => env('IMAGE_QUALITY', 80),
        'webp_enabled' => env('IMAGE_WEBP_ENABLED', true),
        'driver' => extension_loaded('gd') ? 'gd' : (extension_loaded('imagick') ? 'imagick' : null),
    ],

    /*
    |--------------------------------------------------------------------------
    | Eager Loading Strategy
    |--------------------------------------------------------------------------
    |
    | Document which relationships should be eager loaded per resource.
    | Already implemented in controllers/repositories.
    |
    */

    'eager_loading' => [
        'posts' => [
            'with' => ['user', 'community', 'media'],
            'with_count' => ['reactions', 'comments'],
        ],
        'comments' => [
            'with' => ['user', 'reactions'],
        ],
        'conversations' => [
            'with' => ['users', 'lastMessage'],
        ],
        'notifications' => [
            'with' => ['notifiable'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Query Optimization
    |--------------------------------------------------------------------------
    |
    | Recommendations for loadMissing() usage to conditionally load
    | relationships only when needed.
    |
    */

    'lazy_loading' => [
        'posts.show' => ['user', 'community', 'comments.user', 'reactions'],
        'events.show' => ['creator'],
        'jobs.show' => ['company', 'creator'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Invalidation Events
    |--------------------------------------------------------------------------
    |
    | Map model events to cache tags/keys that should be invalidated.
    |
    */

    'invalidation' => [
        'created' => [
            'posts' => ['feed', 'community-posts'],
            'comments' => ['post-comments'],
            'reactions' => ['post-reactions'],
        ],
        'updated' => [
            'users' => ['user-profiles'],
        ],
        'deleted' => [
            'posts' => ['feed', 'community-posts', 'post-comments'],
        ],
    ],

];
