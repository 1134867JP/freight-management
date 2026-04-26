<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Sinaliza que o estado do pátio mudou para uma empresa.
 * O frontend ouve este evento e re-busca os dados via HTTP.
 *
 * Canal: private-yard-board.{company_id}
 * Autorização: apenas admins da empresa (ver routes/channels.php)
 */
class YardBoardUpdated implements ShouldBroadcastNow
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
     * Payload mínimo — o cliente re-busca os dados completos via HTTP.
     */
    public function broadcastWith(): array
    {
        return ['company_id' => $this->companyId];
    }
}
