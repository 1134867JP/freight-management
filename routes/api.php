<?php

use App\Http\Controllers\EvolutionWebhookController;
use App\Http\Middleware\VerifyEvolutionWebhook;
use Illuminate\Support\Facades\Route;

Route::post('/webhooks/evolution', EvolutionWebhookController::class)
    ->middleware([VerifyEvolutionWebhook::class, 'throttle:120,1'])
    ->name('webhooks.evolution');
