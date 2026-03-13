<?php

namespace App\Support;

class WhatsAppPhone
{
    public static function normalize(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $value) ?: '';

        return $digits === '' ? null : $digits;
    }

    public static function isValid(?string $value): bool
    {
        if ($value === null) {
            return false;
        }

        return (bool) preg_match('/^\d{10,15}$/', $value);
    }
}
