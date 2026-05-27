<?php

namespace App\Services\OpenAI;

use RuntimeException;

class MissingOpenAiKeyException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('OPENAI_API_KEY nao esta configurada.');
    }
}
