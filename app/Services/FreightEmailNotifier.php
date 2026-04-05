<?php

namespace App\Services;

use App\Jobs\SendEmailNotificationJob;
use App\Models\Freight;
use App\Models\User;

class FreightEmailNotifier
{
    public function notifyAdminReservationCreated(Freight $freight): void
    {
        $freight->loadMissing(['user', 'timeslot.dropoffAddress']);

        $this->dispatchToAdmin(
            $freight,
            'Nova reserva recebida',
            $this->buildBody([
                'Nova reserva recebida na sua cota.',
                'Cliente: '.$freight->user?->name,
                'Operação: '.$this->operationLabel($freight->operation_type),
                'Horário: '.$this->timeslotLabel($freight),
                'Placa: '.$freight->truck_plate,
                'Motorista: '.$freight->driver_name,
                'Carga: '.$freight->cargo_description,
                'Local: '.$this->locationLabel($freight),
            ]),
            'client_reservation_created',
        );
    }

    public function notifyAdminReservationCancelled(Freight $freight, User $actor): void
    {
        $freight->loadMissing(['user', 'timeslot.dropoffAddress']);

        $this->dispatchToAdmin(
            $freight,
            'Reserva cancelada pelo cliente',
            $this->buildBody([
                'Reserva cancelada pelo cliente.',
                'Cliente: '.$actor->name,
                'Operação: '.$this->operationLabel($freight->operation_type),
                'Horário: '.$this->timeslotLabel($freight),
                'Placa: '.$freight->truck_plate,
            ]),
            'client_reservation_cancelled',
        );
    }

    public function notifyAdminReservationReopened(Freight $freight, User $actor): void
    {
        $freight->loadMissing(['user', 'timeslot.dropoffAddress']);

        $this->dispatchToAdmin(
            $freight,
            'Reserva reaberta pelo cliente',
            $this->buildBody([
                'Reserva reaberta pelo cliente.',
                'Cliente: '.$actor->name,
                'Operação: '.$this->operationLabel($freight->operation_type),
                'Horário: '.$this->timeslotLabel($freight),
                'Placa: '.$freight->truck_plate,
            ]),
            'client_reservation_reopened',
        );
    }

    public function notifyAdminNotaFiscalUploaded(Freight $freight, User $actor): void
    {
        $freight->loadMissing(['user', 'timeslot.dropoffAddress']);

        $lines = [
            'Nota fiscal enviada pelo cliente.',
            'Cliente: '.$actor->name,
            'Horário: '.$this->timeslotLabel($freight),
            'Placa: '.$freight->truck_plate,
        ];

        if ($freight->gross_weight !== null) {
            $lines[] = 'Peso bruto informado: '.$this->formatWeight($freight->gross_weight).' kg';
        }

        $this->dispatchToAdmin($freight, 'Nota fiscal enviada', $this->buildBody($lines), 'client_invoice_uploaded');
    }

    public function notifyClientReservationRejected(Freight $freight, User $actor): void
    {
        $freight->loadMissing(['user', 'timeslot.dropoffAddress']);

        $lines = [
            'Sua reserva foi cancelada pelo administrador.',
            'Admin: '.$actor->name,
            'Operação: '.$this->operationLabel($freight->operation_type),
            'Horário: '.$this->timeslotLabel($freight),
            'Placa: '.$freight->truck_plate,
        ];

        if (filled($freight->admin_notes)) {
            $lines[] = 'Observações: '.$freight->admin_notes;
        }

        $this->dispatchToClient($freight, 'Reserva cancelada', $this->buildBody($lines), 'admin_reservation_rejected');
    }

    public function notifyClientOperationStarted(Freight $freight, User $actor): void
    {
        $freight->loadMissing(['user', 'timeslot.dropoffAddress']);

        $this->dispatchToClient(
            $freight,
            'Operação iniciada',
            $this->buildBody([
                'Sua operação foi iniciada.',
                'Admin: '.$actor->name,
                'Operação: '.$this->operationLabel($freight->operation_type),
                'Horário: '.$this->timeslotLabel($freight),
                'Placa: '.$freight->truck_plate,
            ]),
            'admin_operation_started',
        );
    }

    public function notifyClientOperationFinished(Freight $freight, User $actor): void
    {
        $freight->loadMissing(['user', 'timeslot.dropoffAddress']);

        $lines = [
            'Sua operação foi finalizada.',
            'Admin: '.$actor->name,
            'Operação: '.$this->operationLabel($freight->operation_type),
            'Horário: '.$this->timeslotLabel($freight),
            'Placa: '.$freight->truck_plate,
        ];

        if ($freight->gross_weight !== null) {
            $lines[] = 'Peso bruto: '.$this->formatWeight($freight->gross_weight).' kg';
        }

        if ($freight->net_weight !== null) {
            $lines[] = 'Peso líquido: '.$this->formatWeight($freight->net_weight).' kg';
        }

        if (filled($freight->admin_notes)) {
            $lines[] = 'Observações: '.$freight->admin_notes;
        }

        $this->dispatchToClient($freight, 'Operação finalizada', $this->buildBody($lines), 'admin_operation_finished');
    }

    public function notifyClientAttachmentAdded(Freight $freight, User $actor): void
    {
        $freight->loadMissing(['user', 'timeslot.dropoffAddress']);

        $this->dispatchToClient(
            $freight,
            'Novo anexo adicionado',
            $this->buildBody([
                'Um novo anexo foi adicionado à sua reserva.',
                'Admin: '.$actor->name,
                'Operação: '.$this->operationLabel($freight->operation_type),
                'Horário: '.$this->timeslotLabel($freight),
                'Placa: '.$freight->truck_plate,
            ]),
            'admin_attachment_added',
        );
    }

    public function notifyClientGateCheckIn(Freight $freight, User $actor): void
    {
        $freight->loadMissing(['user', 'timeslot.dropoffAddress']);

        $this->dispatchToClient(
            $freight,
            'Check-in na portaria confirmado',
            $this->buildBody([
                'Sua chegada foi registrada na portaria.',
                'Placa: '.$freight->truck_plate,
                'Motorista: '.$freight->driver_name,
                'Horário de chegada: '.($freight->arrived_at?->format('d/m/Y H:i') ?? now()->format('d/m/Y H:i')),
                'Horário agendado: '.$this->timeslotLabel($freight),
                'Aguarde a chamada para a doca.',
            ]),
            'gate_checkin',
        );
    }

    private function dispatchToAdmin(Freight $freight, string $subject, string $body, string $event): void
    {
        $admin = $freight->timeslot?->creator;
        $email = $admin?->email;

        if (! $email) {
            return;
        }

        SendEmailNotificationJob::dispatch(
            $email,
            $subject,
            $body,
            [
                'company_id'     => $freight->company_id,
                'event'          => $event,
                'recipient_role' => 'admin',
                'recipient_id'   => $admin->id,
                'freight_id'     => $freight->id,
            ],
        )->afterCommit();
    }

    private function dispatchToClient(Freight $freight, string $subject, string $body, string $event): void
    {
        $client = $freight->user;
        $email  = $client?->email;

        if (! $email) {
            return;
        }

        SendEmailNotificationJob::dispatch(
            $email,
            $subject,
            $body,
            [
                'company_id'     => $freight->company_id,
                'event'          => $event,
                'recipient_role' => 'client',
                'recipient_id'   => $client->id,
                'freight_id'     => $freight->id,
            ],
        )->afterCommit();
    }

    private function buildBody(array $lines): string
    {
        $items = implode('', array_map(fn ($l) => "<li style='margin-bottom:6px;'>{$l}</li>", $lines));

        return <<<HTML
        <!DOCTYPE html>
        <html lang="pt-BR">
        <body style="font-family:sans-serif;background:#f4f4f4;padding:24px;">
          <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
            <h2 style="margin-top:0;color:#1e293b;font-size:18px;">Notificação — Gestão de Frete</h2>
            <ul style="padding-left:18px;color:#334155;line-height:1.7;font-size:15px;">
              {$items}
            </ul>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
            <p style="font-size:12px;color:#94a3b8;margin:0;">Mensagem automática. Não responda este e-mail.</p>
          </div>
        </body>
        </html>
        HTML;
    }

    private function operationLabel(?string $type): string
    {
        return match ($type) {
            'load'   => 'Carga',
            'unload' => 'Descarga',
            default  => 'Operação',
        };
    }

    private function timeslotLabel(Freight $freight): string
    {
        $start = $freight->timeslot?->start_time;

        return $start ? $start->format('d/m/Y H:i') : 'Horário indisponível';
    }

    private function locationLabel(Freight $freight): string
    {
        $address = $freight->timeslot?->dropoffAddress;

        if (! $address) {
            return 'Não informado';
        }

        return trim(sprintf('%s - %s/%s', $address->name, $address->city, $address->state));
    }

    private function formatWeight(string|float|int $value): string
    {
        return number_format((float) $value, 2, ',', '.');
    }
}
