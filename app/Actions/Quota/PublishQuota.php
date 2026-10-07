<?php

namespace App\Actions\Quota;

use App\Models\Produto;
use App\Models\Quota;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/**
 * Publica (ou atualiza) uma cota numa única ação: grava a cota, as alocações
 * por cliente e gera a grade de horários.
 */
class PublishQuota
{
    public function __construct(private readonly SyncQuotaTimeslots $syncTimeslots) {}

    /**
     * @param  array<string, mixed>  $data
     * @param  array<int, array{user_id: int, quantity: ?int}>  $allocations
     */
    public function execute(User $actor, array $data, array $allocations = [], ?Quota $quota = null): Quota
    {
        return DB::transaction(function () use ($actor, $data, $allocations, $quota): Quota {
            $attributes = Arr::only($data, [
                'product_name', 'destination', 'operation_type', 'total_quantity', 'starts_on', 'ends_on',
                'hours', 'slot_capacity', 'expected_weight_kg', 'max_per_client', 'rules',
                'requires_invoice', 'requires_weight_ticket',
            ]);

            $attributes['product_name'] = trim((string) $attributes['product_name']);
            $attributes['destination'] = trim((string) $attributes['destination']);
            $attributes['hours'] = $this->normalizeHours($attributes['hours'] ?? []);
            $attributes['produto_id'] = $this->resolveProduto($actor, $attributes['product_name'])->id;

            if ($quota) {
                $quota = Quota::query()->lockForUpdate()->findOrFail($quota->id);
                $quota->update($attributes);
            } else {
                $quota = Quota::query()->create([
                    ...$attributes,
                    'company_id' => $actor->company_id,
                    'status' => Quota::STATUS_PUBLISHED,
                    'created_by' => $actor->id,
                ]);
            }

            $this->syncAllocations($quota, $allocations);
            $this->syncTimeslots->execute($quota);

            return $quota->fresh();
        });
    }

    /** @return list<string> */
    private function normalizeHours(array $hours): array
    {
        $normalized = collect($hours)
            ->map(fn ($hour) => substr(trim((string) $hour), 0, 5))
            ->filter(fn ($hour) => preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $hour) === 1)
            ->unique()
            ->sort()
            ->values()
            ->all();

        return $normalized;
    }

    /** Publicar não deve exigir cadastro prévio: o produto é criado se ainda não existir. */
    private function resolveProduto(User $actor, string $name): Produto
    {
        $produto = Produto::query()
            ->where('company_id', $actor->company_id)
            ->whereRaw('LOWER(nome) = ?', [mb_strtolower($name)])
            ->first();

        return $produto ?? Produto::query()->create([
            'company_id' => $actor->company_id,
            'nome' => $name,
            'is_active' => true,
        ]);
    }

    private function syncAllocations(Quota $quota, array $allocations): void
    {
        $rows = collect($allocations)
            ->filter(fn ($row) => ! empty($row['user_id']))
            ->keyBy(fn ($row) => (int) $row['user_id']);

        $quota->allocations()->whereNotIn('user_id', $rows->keys()->all())->delete();

        foreach ($rows as $userId => $row) {
            $quota->allocations()->updateOrCreate(
                ['user_id' => $userId],
                ['quantity' => isset($row['quantity']) && $row['quantity'] !== '' ? (int) $row['quantity'] : null],
            );
        }
    }
}
