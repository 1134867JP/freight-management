<?php

namespace App\Providers;

use App\Contracts\YmsIntentClassifier;
use App\Services\Ai\GroqYmsIntentClassifier;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(YmsIntentClassifier::class, GroqYmsIntentClassifier::class);
    }

    public function boot(): void
    {
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        Vite::prefetch(concurrency: 3);
    }
}
