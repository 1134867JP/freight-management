<?php

namespace App\Http\Controllers;

use App\Jobs\SendWhatsAppMessageJob;
use App\Models\WhatsAppInstance;
use App\Services\WhatsApp\EvolutionWebhookMessageExtractor;
use App\Services\WhatsApp\TimeslotWhatsAppBot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EvolutionWebhookController extends Controller
{
    public function __invoke(
        Request $request,
        EvolutionWebhookMessageExtractor $extractor,
        TimeslotWhatsAppBot $bot,
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
            return response()->json(['received' => true]);
        }

        $instance = $instances->first();
        $reply = $bot->handle($instance, $message);

        if ($reply) {
            SendWhatsAppMessageJob::dispatch(
                $reply['phone'],
                $reply['text'],
                $reply['context'],
                $reply['company_id'],
            );
        }

        return response()->json(['received' => true]);
    }
}
