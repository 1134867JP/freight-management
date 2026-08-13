<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'evolution' => [
        'enabled' => env('EVOLUTION_ENABLED', false),
        'base_url' => env('EVOLUTION_BASE_URL'),
        'api_key' => env('EVOLUTION_API_KEY'),
        'instance' => env('EVOLUTION_INSTANCE'),
        'timeout' => (int) env('EVOLUTION_TIMEOUT', 10),
        'bot' => [
            'enabled' => env('EVOLUTION_BOT_ENABLED', false),
            'webhook_url' => env('EVOLUTION_WEBHOOK_URL'),
            'webhook_secret' => env('EVOLUTION_WEBHOOK_SECRET'),
            'confirmation_ttl_minutes' => (int) env('EVOLUTION_BOT_CONFIRMATION_TTL', 10),
            'timeslot_duration_minutes' => (int) env('EVOLUTION_BOT_TIMESLOT_DURATION', 60),
            'max_capacity' => (int) env('EVOLUTION_BOT_MAX_CAPACITY', 500),
        ],
    ],

    'yms_assistant' => [
        'enabled' => env('YMS_ASSISTANT_ENABLED', false),
        'provider' => env('YMS_ASSISTANT_PROVIDER', 'groq'),
        'fallback_providers' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('YMS_ASSISTANT_FALLBACK_PROVIDERS', 'gemini')),
        ))),
        'base_url' => env('GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
        'api_key' => env('GROQ_API_KEY'),
        'model' => env('GROQ_MODEL', 'openai/gpt-oss-20b'),
        'timeout' => (int) env('YMS_ASSISTANT_TIMEOUT', 5),
        'max_completion_tokens' => (int) env('YMS_ASSISTANT_MAX_COMPLETION_TOKENS', 256),
        'reasoning_effort' => env('YMS_ASSISTANT_REASONING_EFFORT', 'low'),
        'per_user_per_minute' => (int) env('YMS_ASSISTANT_PER_USER_PER_MINUTE', 10),
        'global_per_minute' => (int) env('YMS_ASSISTANT_GLOBAL_PER_MINUTE', 25),
        'daily_limit' => (int) env('YMS_ASSISTANT_DAILY_LIMIT', 300),
        'gemini' => [
            'base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
            'api_key' => env('GEMINI_API_KEY'),
            'model' => env('GEMINI_MODEL', 'gemini-2.5-flash'),
        ],
    ],

];
