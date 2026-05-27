<?php

namespace App\Services\Bible\Agents;

interface BibleAgent
{
    public function key(): string;

    public function name(): string;

    /**
     * @param  array<int, array{reference: string, text: string, translation: string|null}>  $verses
     */
    public function analyze(string $question, array $verses): string;
}
