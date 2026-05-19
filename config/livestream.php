<?php

return [
    'rtmp_server' => env('RTMP_SERVER', 'rtmp://stream.isdb-bisew.org'),
    'hls_server' => env('HLS_SERVER', 'https://stream.isdb-bisew.org/hls'),

    'hls_playback_url' => function (string $streamKey) {
        return config('livestream.hls_server') . '/' . $streamKey . '.m3u8';
    },

    'rtmp_url' => function (string $streamKey) {
        return config('livestream.rtmp_server') . '/live/' . $streamKey;
    },

    // LiveKit configuration for audio/video calls
    'livekit' => [
        'host' => env('LIVEKIT_HOST', 'https://rtc.isdb-bisew.org'),
        'api_key' => env('LIVEKIT_API_KEY', ''),
        'api_secret' => env('LIVEKIT_API_SECRET', ''),
        'ws_url' => env('LIVEKIT_WS_URL', 'wss://rtc.isdb-bisew.org'),
    ],

    // SRS Media Server configuration for HLS streaming
    'srs' => [
        'api_url' => env('SRS_API_URL', 'http://localhost:1985'),
        'rtmp_port' => env('SRS_RTMP_PORT', 1935),
        'http_port' => env('SRS_HTTP_PORT', 8080),
    ],

    // Coturn TURN server
    'turn' => [
        'server' => env('TURN_SERVER', 'turn.isdb-bisew.org'),
        'port' => env('TURN_PORT', 3478),
        'secret' => env('TURN_SECRET', ''),
    ],
];
