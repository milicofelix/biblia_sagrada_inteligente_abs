<?php

return [
    'api_key' => env('OPENAI_API_KEY'),
    'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
    'model' => env('OPENAI_MODEL', 'gpt-4.1-mini'),
    'timeout' => (int) env('OPENAI_TIMEOUT', 180),
    'retry_times' => (int) env('OPENAI_RETRY_TIMES', 2),
    'retry_sleep' => (int) env('OPENAI_RETRY_SLEEP', 1500),
];
