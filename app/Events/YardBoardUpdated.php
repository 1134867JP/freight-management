<?php

namespace App\Events;

use App\Models\Company;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Sinaliza que o estado do pátio mudou para uma empresa.
 * O frontend ouve este evento e re-busca os dados via HTTP.
 *
 * Canal: private-yard-board.{company_id}
 * Autorização: apenas admins da empresa (ver routes/channels.php)
 */
class YardBoardUpdated implements ShouldBroadcast, ShouldRescue
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly int $companyId) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("yard-board.{$this->companyId}")];
    }

    public function broadcastAs(): string
    {
        return 'YardBoardUpdated';
    }

    /**
     * O painel em tempo real não faz parte do modo piloto e também não deve
     * tornar o fluxo principal dependente de um servidor Reverb nesse modo.
     */
    public function broadcastWhen(): bool
    {
        $company = Company::query()->find($this->companyId);

        return $company?->usesQueues() === true && ! $company->isPilotMode();
    }

    /**
     * Payload mínimo — o cliente re-busca os dados completos via HTTP.
     */
    public function broadcastWith(): array
    {
        return ['company_id' => $this->companyId];
    }
}
