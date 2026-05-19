<?php

return [
    'ranking' => [
        'weights' => [
            'reaction' => (float) env('FEED_WEIGHT_REACTION', 2),
            'comment' => (float) env('FEED_WEIGHT_COMMENT', 3),
        ],
        'bonuses' => [
            'recency_24h' => (float) env('FEED_BONUS_RECENCY_24H', 10),
            'recency_7d' => (float) env('FEED_BONUS_RECENCY_7D', 5),
            'friend' => (float) env('FEED_BONUS_FRIEND', 3),
            'community' => (float) env('FEED_BONUS_COMMUNITY', 2),
        ],
    ],

    'reaction_types' => [
        'like', 'love', 'care', 'haha', 'wow', 'sad', 'angry',
    ],

    'default_sort' => env('FEED_DEFAULT_SORT', 'smart'),
];
