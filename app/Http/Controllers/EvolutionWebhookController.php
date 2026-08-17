<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessEvolutionWebhookJob;
use App\Models\WhatsAppInstance;
use App\Services\WhatsApp\EvolutionWebhookMessageExtractor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EvolutionWebhookController extends Controller
{
    public function __invoke(
        Request $request,
        EvolutionWebhookMessageExtractor $extractor,
    ): JsonResponse {
        $message = $extractor->extract($request->all());

        if (! $message) {
            return response()->json(['received' => true]);
        }

        $instances = WhatsAppInstance::query()
            ->where('instance_name', $message['instance_name'])
            ->where('is_active', true)
            ->limit(2)
            ->get();

        // O nome recebido precisa identificar uma única empresa. Em caso de
        // configuração legada duplicada, ignoramos em vez de adivinhar o tenant.
        if ($instances->count() !== 1) {
            Log::warning('Webhook do WhatsApp sem correspondência única de instância.', [
                'instance_name' => $message['instance_name'],
                'matches' => $instances->count(),
                'external_message_id' => $message['external_message_id'],
            ]);

            return response()->json(['received' => true]);
        }

        $instance = $instances->first();
        ProcessEvolutionWebhookJob::dispatch($instance->id, $instance->company_id, $message);

        return response()->json(['received' => true]);
    }
}
