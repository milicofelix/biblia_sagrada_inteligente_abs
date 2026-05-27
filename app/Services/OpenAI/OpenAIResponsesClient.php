<?php

namespace App\Services\OpenAI;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

class OpenAIResponsesClient
{
    public function create(array $payload): array
    {
        if (! config('openai.api_key')) {
            throw new MissingOpenAiKeyException;
        }

        $response = $this->http()
            ->post('/responses', [
                'model' => config('openai.model'),
                ...$payload,
            ])
            ->throw()
            ->json();

        return is_array($response) ? $response : [];
    }

    public function text(array $payload): string
    {
        return $this->extractText($this->create($payload));
    }

    private function http(): PendingRequest
    {
        return Http::baseUrl(config('openai.base_url'))
            ->withToken(config('openai.api_key'))
            ->acceptJson()
            ->asJson()
            ->retry(config('openai.retry_times'), config('openai.retry_sleep'), throw: false)
            ->timeout(config('openai.timeout'));
    }

    private function extractText(array $response): string
    {
        if (isset($response['output_text']) && is_string($response['output_text'])) {
            return trim($response['output_text']);
        }

        $parts = [];

        foreach ($response['output'] ?? [] as $output) {
            foreach ($output['content'] ?? [] as $content) {
                $text = $content['text'] ?? null;

                if (is_string($text)) {
                    $parts[] = $text;
                }
            }
        }

        return trim(implode("\n", $parts));
    }
}
