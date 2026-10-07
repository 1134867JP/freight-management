<?php

namespace App\Services\Quota;

use App\Models\Freight;
use App\Models\Quota;
use App\Models\User;
use App\Services\WhatsApp\WhatsAppOutbox;
use Illuminate\Support\Collection;

/**
 * O WhatsApp é só o canal: avisa e leva o cliente para o CargoHub, onde
 * o agendamento, os documentos e o acompanhamento acontecem.
 */
class QuotaWhatsAppNotifier
{
    public function __construct(private readonly WhatsAppOutbox $outbox) {}

    /**
     * Avisa os clientes elegíveis que têm saldo nesta cota.
     *
     * @return array{sent: int, skipped: int, failed: int}
     */
    public function announce(Quota $quota): array
    {
        $quota->loadMissing('allocations');

        $clients = $this->eligibleClients($quota);
        $sent = 0;
        $skipped = 0;
        $failed = 0;
        $period = $quota->starts_on->format('d/m').' a '.$quota->ends_on->format('d/m');

        foreach ($clients as $client) {
            $phone = $client->routeWhatsAppPhone();
            $available = $quota->availableFor($client);

            if (! $phone || $available === 0) {
                $skipped++;

                continue;
            }

            $firstName = strtok((string) $client->name, ' ');
            $message = implode("\n", [
                "Olá, {$firstName}. Existem {$available} cotas disponíveis para {$quota->destination} ({$quota->product_name}), de {$period}.",
                '',
                'Escolha o horário e agende pelo CargoHub:',
                route('client.quotas.book', $quota),
            ]);

            try {
                $this->outbox->enqueue(
                    companyId: $quota->company_id,
                    phone: $phone,
                    message: $message,
                    idempotencyKey: 'quota-announcement:'.$quota->id.':'.$client->id.':'.now()->format('Y-m-d-H'),
                    context: [
                        'company_id' => $quota->company_id,
                        'event' => 'quota_announced',
                        'recipient_role' => 'client',
                        'recipient_id' => $client->id,
                        'quota_id' => $quota->id,
                    ],
                );
                $sent++;
            } catch (\Throwable $e) {
                // Um envio com falha não interrompe o aviso aos demais clientes.
                report($e);
                $failed++;
            }
        }

        $quota->forceFill(['notified_at' => now()])->save();

        return ['sent' => $sent, 'skipped' => $skipped, 'failed' => $failed];
    }

    /** Confirmação para o cliente com o link do agendamento. */
    public function bookingConfirmed(Collection $freights): void
    {
        /** @var Freight|null $first */
        $first = $freights->first();
        $client = $first?->user;
        $phone = $client?->routeWhatsAppPhone();

        if (! $first || ! $phone) {
            return;
        }

        $first->loadMissing(['timeslot', 'quota']);
        $codes = $freights->map->code->join(', ');
        $count = $freights->count();

        $lines = [
            $count > 1 ? "{$count} agendamentos confirmados: {$codes}" : "Agendamento confirmado: {$codes}",
            'Data: '.$first->timeslot->start_time->format('d/m').' às '.$first->timeslot->start_time->format('H:i'),
            'Destino: '.$first->quota?->destination,
            'Produto: '.$first->quota?->product_name,
        ];

        if ($pending = \App\Support\BookingPresenter::pendingActions($first)) {
            $lines[] = '';
            $lines[] = 'Pendências: '.collect($pending)->pluck('label')->join('; ').'.';
        }

        $lines[] = '';
        $lines[] = 'Acompanhe e envie documentos pelo CargoHub:';
        $lines[] = route('client.bookings.show', $first);

        $this->outbox->enqueue(
            companyId: $first->company_id,
            phone: $phone,
            message: implode("\n", $lines),
            idempotencyKey: 'quota-booking-confirmed:'.$freights->pluck('id')->join('-'),
            context: [
                'company_id' => $first->company_id,
                'event' => 'quota_booking_confirmed',
                'recipient_role' => 'client',
                'recipient_id' => $client->id,
                'freight_id' => $first->id,
                'quota_id' => $first->quota_id,
            ],
        );
    }

    /** @return Collection<int, User> */
    private function eligibleClients(Quota $quota): Collection
    {
        if ($quota->allocations->isNotEmpty()) {
            return User::query()
                ->whereIn('id', $quota->allocations->pluck('user_id'))
                ->where('role', User::ROLE_CLIENT)
                ->get();
        }

        return User::query()
            ->where('company_id', $quota->company_id)
            ->where('role', User::ROLE_CLIENT)
            ->get();
    }
}
