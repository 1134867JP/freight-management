<?php

use App\Http\Controllers\EvolutionWebhookController;
use App\Http\Controllers\ReadinessController;
use App\Http\Middleware\VerifyEvolutionWebhook;
use Illuminate\Support\Facades\Route;

Route::get('/ready', ReadinessController::class)->name('health.ready');

Route::post('/webhooks/evolution', EvolutionWebhookController::class)
    ->middleware([VerifyEvolutionWebhook::class, 'throttle:120,1'])
    ->name('webhooks.evolution');
