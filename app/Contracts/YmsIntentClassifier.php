<?php

namespace App\Contracts;

use Carbon\CarbonImmutable;

interface YmsIntentClassifier
{
    public function isReady(): bool;

    public function classify(string $message, CarbonImmutable $now): ?array;
}
