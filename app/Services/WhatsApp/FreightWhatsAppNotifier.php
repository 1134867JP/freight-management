<?php

namespace App\Services\WhatsApp;

use App\Jobs\SendWhatsAppMessageJob;
use App\Models\Freight;
use App\Models\User;

class FreightWhatsAppNotifier
{
    public function notifyAdminReservationCreated(Freight $freight): void
    {
        $freight->loadMissing(['user', 'timeslot.creator', 'timeslot.dropoffAddress']);

        $this->dispatchToAdmin(
            $freight,
            implode("\n", [
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
        $freight->loadMissing(['user', 'timeslot.creator', 'timeslot.dropoffAddress']);

        $this->dispatchToAdmin(
            $freight,
            implode("\n", [
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
        $freight->loadMissing(['user', 'timeslot.creator', 'timeslot.dropoffAddress']);

        $this->dispatchToAdmin(
            $freight,
            implode("\n", [
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
        $freight->loadMissing(['user', 'timeslot.creator', 'timeslot.dropoffAddress']);

        $arrLines = [
            'Nota fiscal enviada pelo cliente.',
            'Cliente: '.$actor->name,
            'Horário: '.$this->timeslotLabel($freight),
            'Placa: '.$freight->truck_plate,
        ];

        if ($freight->gross_weight !== null) {
            $arrLines[] = 'Peso bruto informado: '.$this->formatWeight($freight->gross_weight).' kg';
        }

        $this->dispatchToAdmin($freight, implode("\n", $arrLines), 'client_invoice_uploaded');
    }

    public function notifyClientReservationRejected(Freight $freight, User $actor): void
    {
        $freight->loadMissing(['user', 'timeslot.creator', 'timeslot.dropoffAddress']);

        $arrLines = [
            'Sua reserva foi cancelada pelo admin.',
            'Admin: '.$actor->name,
            'Operação: '.$this->operationLabel($freight->operation_type),
            'Horário: '.$this->timeslotLabel($freight),
            'Placa: '.$freight->truck_plate,
        ];

        if (filled($freight->admin_notes)) {
            $arrLines[] = 'Observações: '.$freight->admin_notes;
        }

        $this->dispatchToClient($freight, implode("\n", $arrLines), 'admin_reservation_rejected');
    }

    public function notifyClientOperationStarted(Freight $freight, User $actor): void
    {
        $freight->loadMissing(['user', 'timeslot.creator', 'timeslot.dropoffAddress']);

        $this->dispatchToClient(
            $freight,
            implode("\n", [
                'Sua operação foi iniciada pelo admin.',
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
        $freight->loadMissing(['user', 'timeslot.creator', 'timeslot.dropoffAddress']);

        $arrLines = [
            'Sua operação foi finalizada pelo admin.',
            'Admin: '.$actor->name,
            'Operação: '.$this->operationLabel($freight->operation_type),
            'Horário: '.$this->timeslotLabel($freight),
            'Placa: '.$freight->truck_plate,
        ];

        if ($freight->gross_weight !== null) {
            $arrLines[] = 'Peso bruto: '.$this->formatWeight($freight->gross_weight).' kg';
        }

        if ($freight->net_weight !== null) {
            $arrLines[] = 'Peso líquido: '.$this->formatWeight($freight->net_weight).' kg';
        }

        if (filled($freight->admin_notes)) {
            $arrLines[] = 'Observações: '.$freight->admin_notes;
        }

        $this->dispatchToClient($freight, implode("\n", $arrLines), 'admin_operation_finished');
    }

    public function notifyClientAttachmentAdded(Freight $freight, User $actor): void
    {
        $freight->loadMissing(['user', 'timeslot.creator', 'timeslot.dropoffAddress']);

        $arrLines = [
            'Um novo anexo foi adicionado à sua reserva.',
            'Admin: '.$actor->name,
            'Operação: '.$this->operationLabel($freight->operation_type),
            'Horário: '.$this->timeslotLabel($freight),
            'Placa: '.$freight->truck_plate,
        ];

        if (filled($freight->admin_notes)) {
            $arrLines[] = 'Observações: '.$freight->admin_notes;
        }

        $this->dispatchToClient($freight, implode("\n", $arrLines), 'admin_attachment_added');
    }

    private function dispatchToAdmin(Freight $freight, string $text, string $event): void
    {
        $objAdmin = $freight->timeslot?->creator;
        $strPhone = $objAdmin?->routeWhatsAppPhone();

        if (! $strPhone) {
            return;
        }

        SendWhatsAppMessageJob::dispatch(
            $strPhone,
            $text,
            [
                'company_id' => $freight->company_id,
                'event' => $event,
                'recipient_role' => 'admin',
                'recipient_id' => $objAdmin->id,
                'freight_id' => $freight->id,
                'timeslot_id' => $freight->timeslot_id,
            ],
            $freight->company_id,
        )->afterCommit();
    }

    private function dispatchToClient(Freight $freight, string $text, string $event): void
    {
        $objClient = $freight->user;
        $strPhone = $objClient?->routeWhatsAppPhone();

        if (! $strPhone) {
            return;
        }

        SendWhatsAppMessageJob::dispatch(
            $strPhone,
            $text,
            [
                'company_id' => $freight->company_id,
                'event' => $event,
                'recipient_role' => 'client',
                'recipient_id' => $objClient->id,
                'freight_id' => $freight->id,
                'timeslot_id' => $freight->timeslot_id,
            ],
            $freight->company_id,
        )->afterCommit();
    }

    private function operationLabel(?string $operationType): string
    {
        return match ($operationType) {
            'load' => 'Carga',
            'unload' => 'Descarga',
            default => 'Operação',
        };
    }

    private function timeslotLabel(Freight $freight): string
    {
        $dtStartTime = $freight->timeslot?->start_time;

        return $dtStartTime ? $dtStartTime->format('d/m/Y H:i') : 'Horário indisponível';
    }

    private function locationLabel(Freight $freight): string
    {
        $objAddress = $freight->timeslot?->dropoffAddress;

        if (! $objAddress) {
            return 'Não informado';
        }

        return trim(sprintf('%s - %s/%s', $objAddress->name, $objAddress->city, $objAddress->state));
    }

    private function formatWeight(string|float|int $value): string
    {
        return number_format((float) $value, 2, ',', '.');
    }
}
