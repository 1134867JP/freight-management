<?php

namespace App\Services\WhatsApp;

use App\Enums\DocaStatus;
use App\Enums\FreightStatus;
use App\Models\Company;
use App\Models\Doca;
use App\Models\Freight;
use App\Models\Timeslot;
use App\Models\User;
use App\Models\WhatsAppCommand;
use App\Support\YmsAssistantIntent;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Throwable;

class YmsOperationalQueryService
{
    public function answer(Company $company, array $query, CarbonImmutable $now): array
    {
        $date = $this->queryDate((string) ($query['date'] ?? ''), $now);

        if (! $date) {
            return $this->failure(
                'Não consegui identificar a data. Tente novamente usando hoje, amanhã ou DD/MM/AAAA.',
                ['reason' => 'invalid_date'],
            );
        }

        return match ($query['intent'] ?? YmsAssistantIntent::UNSUPPORTED) {
            YmsAssistantIntent::TIMESLOT_CAPACITY => $this->timeslotCapacity($company, $date, $now),
            YmsAssistantIntent::YARD_VEHICLES => $this->yardVehicles($company, $now),
            YmsAssistantIntent::LATE_FREIGHTS => $this->lateFreights($company, $date, $now),
            YmsAssistantIntent::MISSING_ARRIVALS => $this->missingArrivals($company, $date, $now),
            YmsAssistantIntent::AVAILABLE_DOCKS => $this->availableDocks($company, $now),
            YmsAssistantIntent::CLIENT_OPERATION => $this->clientOperation(
                $company,
                $date,
                (string) ($query['client_name'] ?? ''),
                $now,
            ),
            YmsAssistantIntent::AVERAGE_SERVICE_TIME => $this->averageServiceTime($company, $date, $now),
            YmsAssistantIntent::OPERATIONAL_ISSUES => $this->operationalIssues($company, $date, $now),
            YmsAssistantIntent::OPERATION_SUMMARY => $this->operationSummary($company, $date, $now),
            default => $this->unsupported(),
        };
    }

    private function timeslotCapacity(
        Company $company,
        CarbonImmutable $date,
        CarbonImmutable $now,
    ): array {
        [$from, $to] = $this->dayRange($date);
        $slots = Timeslot::query()
            ->where('company_id', $company->id)
            ->whereBetween('start_time', [$from, $to])
            ->where('status', '!=', Timeslot::STATUS_CLOSED)
            ->withCount(['freights as used_capacity' => fn (Builder $query) => $query->occupying()])
            ->orderBy('start_time')
            ->get();

        if ($slots->isEmpty()) {
            return $this->success(
                $this->dayLabel($date, $now).' não possui cotas abertas cadastradas.'.$this->updatedAt($now),
                ['total_capacity' => 0, 'reserved' => 0, 'available' => 0, 'timeslots' => 0],
            );
        }

        $total = (int) $slots->sum('capacity');
        $reserved = (int) $slots->sum(fn (Timeslot $slot): int => min(
            (int) $slot->capacity,
            (int) $slot->used_capacity,
        ));
        $available = (int) $slots->sum(fn (Timeslot $slot): int => max(
            0,
            (int) $slot->capacity - (int) $slot->used_capacity,
        ));

        $breakdown = $slots
            ->groupBy(fn (Timeslot $slot): string => $slot->start_time->format('H:i'))
            ->map(fn (Collection $items): int => (int) $items->sum(
                fn (Timeslot $slot): int => max(0, (int) $slot->capacity - (int) $slot->used_capacity),
            ))
            ->filter(fn (int $remaining): bool => $remaining > 0)
            ->take(8);

        $lines = [
            $this->dayLabel($date, $now).", restam {$available} de {$total} cotas.",
            "Reservadas: {$reserved}.",
        ];

        foreach ($breakdown as $time => $remaining) {
            $lines[] = "• {$time}: {$remaining} disponíveis";
        }

        $lines[] = $this->updatedAt($now, false);

        return $this->success(implode("\n", $lines), [
            'total_capacity' => $total,
            'reserved' => $reserved,
            'available' => $available,
            'timeslots' => $slots->count(),
        ]);
    }

    private function yardVehicles(Company $company, CarbonImmutable $now): array
    {
        $freights = Freight::query()
            ->where('company_id', $company->id)
            ->inYard()
            ->with(['user:id,name', 'timeslot:id,start_time'])
            ->orderBy('arrived_at')
            ->get();

        if ($freights->isEmpty()) {
            return $this->success(
                'Não há veículos no pátio agora.'.$this->updatedAt($now),
                ['count' => 0],
            );
        }

        $lines = ["Há {$freights->count()} veículos no pátio agora:"];
        $lines = [...$lines, ...$this->freightLines($freights)];
        $lines[] = $this->remainingLabel($freights->count());
        $lines = array_values(array_filter($lines));
        $lines[] = $this->updatedAt($now, false);

        return $this->success(implode("\n", $lines), ['count' => $freights->count()]);
    }

    private function lateFreights(
        Company $company,
        CarbonImmutable $date,
        CarbonImmutable $now,
    ): array {
        $freights = $this->lateFreightsQuery($company, $date, $now)
            ->with(['user:id,name', 'timeslot:id,start_time'])
            ->get()
            ->sortBy(fn (Freight $freight) => $freight->timeslot?->start_time)
            ->values();

        if ($freights->isEmpty()) {
            return $this->success(
                'Não há veículos atrasados para '.$this->dayLabel($date, $now, true).'.'.$this->updatedAt($now),
                ['count' => 0],
            );
        }

        $lines = ["Há {$freights->count()} veículos atrasados:"];
        $lines = [...$lines, ...$this->freightLines($freights, true)];
        $lines[] = $this->remainingLabel($freights->count());
        $lines = array_values(array_filter($lines));
        $lines[] = $this->updatedAt($now, false);

        return $this->success(implode("\n", $lines), ['count' => $freights->count()]);
    }

    private function missingArrivals(
        Company $company,
        CarbonImmutable $date,
        CarbonImmutable $now,
    ): array {
        [$from, $to] = $this->dayRange($date);
        $freights = Freight::query()
            ->where('company_id', $company->id)
            ->where('status', FreightStatus::Reserved->value)
            ->whereHas('timeslot', fn (Builder $query) => $query
                ->where('company_id', $company->id)
                ->whereBetween('start_time', [$from, $to]))
            ->with(['user:id,name', 'timeslot:id,start_time'])
            ->get()
            ->sortBy(fn (Freight $freight) => $freight->timeslot?->start_time)
            ->values();

        if ($freights->isEmpty()) {
            return $this->success(
                'Todos os agendamentos de '.$this->dayLabel($date, $now, true).' já chegaram ou foram encerrados.'.$this->updatedAt($now),
                ['count' => 0],
            );
        }

        $lines = ["{$freights->count()} agendamentos ainda não chegaram:"];
        $lines = [...$lines, ...$this->freightLines($freights, true)];
        $lines[] = $this->remainingLabel($freights->count());
        $lines = array_values(array_filter($lines));
        $lines[] = $this->updatedAt($now, false);

        return $this->success(implode("\n", $lines), ['count' => $freights->count()]);
    }

    private function availableDocks(Company $company, CarbonImmutable $now): array
    {
        if (! $company->usesDocks()) {
            return $this->success(
                'O controle de docas não está habilitado para esta empresa.',
                ['module_enabled' => false, 'available' => 0],
            );
        }

        $docks = Doca::query()
            ->where('company_id', $company->id)
            ->where('is_active', true)
            ->where('status', DocaStatus::Available->value)
            ->orderBy('codigo')
            ->get(['id', 'nome', 'codigo']);

        if ($docks->isEmpty()) {
            return $this->success(
                'Nenhuma doca está livre agora.'.$this->updatedAt($now),
                ['module_enabled' => true, 'available' => 0],
            );
        }

        $names = $docks
            ->take(8)
            ->map(fn (Doca $dock): string => filled($dock->codigo)
                ? "{$dock->codigo} ({$dock->nome})"
                : $dock->nome)
            ->implode(', ');

        return $this->success(
            "{$docks->count()} docas livres: {$names}.".$this->updatedAt($now),
            ['module_enabled' => true, 'available' => $docks->count()],
        );
    }

    private function clientOperation(
        Company $company,
        CarbonImmutable $date,
        string $clientName,
        CarbonImmutable $now,
    ): array {
        $resolution = $this->resolveClient($company, $clientName);

        if (! $resolution['client']) {
            return $this->failure($resolution['error'], ['reason' => 'client_not_resolved']);
        }

        /** @var User $client */
        $client = $resolution['client'];
        [$from, $to] = $this->dayRange($date);
        $freights = Freight::query()
            ->where('company_id', $company->id)
            ->where('user_id', $client->id)
            ->whereHas('timeslot', fn (Builder $query) => $query
                ->where('company_id', $company->id)
                ->whereBetween('start_time', [$from, $to]))
            ->get(['id', 'status']);

        if ($freights->isEmpty()) {
            return $this->success(
                "O cliente {$client->name} não possui agendamentos para ".$this->dayLabel($date, $now, true).'.'.$this->updatedAt($now),
                ['client_id' => $client->id, 'client_name' => $client->name, 'total' => 0],
            );
        }

        $counts = $freights->countBy(fn (Freight $freight): string => $freight->status->value);
        $parts = collect(FreightStatus::cases())
            ->map(fn (FreightStatus $status): ?string => ($counts[$status->value] ?? 0) > 0
                ? $status->label().': '.$counts[$status->value]
                : null)
            ->filter()
            ->implode(' · ');

        return $this->success(
            "Operação de {$client->name} em ".$this->dayLabel($date, $now, true).": {$freights->count()} agendamentos. {$parts}.".$this->updatedAt($now),
            [
                'client_id' => $client->id,
                'client_name' => $client->name,
                'total' => $freights->count(),
                'by_status' => $counts->all(),
            ],
        );
    }

    private function averageServiceTime(
        Company $company,
        CarbonImmutable $date,
        CarbonImmutable $now,
    ): array {
        [$from, $to] = $this->dayRange($date);
        $durations = Freight::query()
            ->where('company_id', $company->id)
            ->whereBetween('completed_at', [$from, $to])
            ->whereNotNull('operation_started_at')
            ->get(['operation_started_at', 'completed_at'])
            ->filter(fn (Freight $freight): bool => $freight->completed_at->greaterThanOrEqualTo($freight->operation_started_at))
            ->map(fn (Freight $freight): float => $freight->operation_started_at->diffInSeconds($freight->completed_at) / 60);

        if ($durations->isEmpty()) {
            return $this->success(
                'Ainda não há operações concluídas com tempo medido em '.$this->dayLabel($date, $now, true).'.'.$this->updatedAt($now),
                ['samples' => 0, 'average_minutes' => null],
            );
        }

        $average = round((float) $durations->average(), 1);

        return $this->success(
            'O tempo médio de operação em '.$this->dayLabel($date, $now, true).' é '
                .$this->durationLabel($average).", com {$durations->count()} amostras."
                .$this->updatedAt($now),
            ['samples' => $durations->count(), 'average_minutes' => $average],
        );
    }

    private function operationalIssues(
        Company $company,
        CarbonImmutable $date,
        CarbonImmutable $now,
    ): array {
        [$from, $to] = $this->dayRange($date);
        $late = $this->lateFreightsQuery($company, $date, $now)->count();
        $whatsAppFailures = WhatsAppCommand::query()
            ->where('company_id', $company->id)
            ->whereIn('status', [
                WhatsAppCommand::STATUS_FAILED,
                WhatsAppCommand::STATUS_REJECTED,
                WhatsAppCommand::STATUS_EXPIRED,
            ])
            ->whereBetween('updated_at', [$from, $to])
            ->count();
        $overTwelveHours = $date->isSameDay($now)
            ? Freight::query()
                ->where('company_id', $company->id)
                ->inYard()
                ->whereNotNull('arrived_at')
                ->where('arrived_at', '<=', $now->subHours(12))
                ->count()
            : 0;

        $issues = array_values(array_filter([
            $late > 0 ? "{$late} veículos atrasados" : null,
            $whatsAppFailures > 0 ? "{$whatsAppFailures} comandos do WhatsApp com falha, rejeição ou expiração" : null,
            $overTwelveHours > 0 ? "{$overTwelveHours} veículos há mais de 12h no pátio" : null,
        ]));

        if ($issues === []) {
            return $this->success(
                'Não encontrei falhas ou pendências monitoradas em '.$this->dayLabel($date, $now, true).'.'.$this->updatedAt($now),
                ['late' => 0, 'whatsapp_failures' => 0, 'over_12h_in_yard' => 0],
            );
        }

        return $this->success(
            'Pendências de '.$this->dayLabel($date, $now, true).":\n• ".implode("\n• ", $issues)."\n".$this->updatedAt($now, false),
            [
                'late' => $late,
                'whatsapp_failures' => $whatsAppFailures,
                'over_12h_in_yard' => $overTwelveHours,
            ],
        );
    }

    private function operationSummary(
        Company $company,
        CarbonImmutable $date,
        CarbonImmutable $now,
    ): array {
        [$from, $to] = $this->dayRange($date);
        $scheduled = Freight::query()
            ->where('company_id', $company->id)
            ->whereHas('timeslot', fn (Builder $query) => $query
                ->where('company_id', $company->id)
                ->whereBetween('start_time', [$from, $to]))
            ->get(['id', 'status']);
        $counts = $scheduled->countBy(fn (Freight $freight): string => $freight->status->value);
        $late = $this->lateFreightsQuery($company, $date, $now)->count();

        $lines = [
            'Resumo de '.$this->dayLabel($date, $now, true).':',
            "• Agendamentos: {$scheduled->count()}",
            '• Finalizados: '.($counts[FreightStatus::Completed->value] ?? 0),
            '• Aguardando chegada: '.($counts[FreightStatus::Reserved->value] ?? 0),
            "• Atrasados: {$late}",
        ];

        if ($date->isSameDay($now)) {
            $inYard = Freight::query()->where('company_id', $company->id)->inYard()->count();
            $lines[] = "• No pátio agora: {$inYard}";

            if ($company->usesDocks()) {
                $availableDocks = Doca::query()
                    ->where('company_id', $company->id)
                    ->where('is_active', true)
                    ->where('status', DocaStatus::Available->value)
                    ->count();
                $lines[] = "• Docas livres: {$availableDocks}";
            }
        }

        $lines[] = $this->updatedAt($now, false);

        return $this->success(implode("\n", $lines), [
            'scheduled' => $scheduled->count(),
            'by_status' => $counts->all(),
            'late' => $late,
        ]);
    }

    private function lateFreightsQuery(
        Company $company,
        CarbonImmutable $date,
        CarbonImmutable $now,
    ): Builder {
        [$from, $to] = $this->dayRange($date);

        return Freight::query()
            ->where('company_id', $company->id)
            ->where('status', FreightStatus::Reserved->value)
            ->whereHas('timeslot', fn (Builder $query) => $query
                ->where('company_id', $company->id)
                ->whereBetween('start_time', [$from, $to])
                ->where('start_time', '<', $now));
    }

    private function freightLines(Collection $freights, bool $showScheduledTime = false): array
    {
        return $freights
            ->take(5)
            ->map(function (Freight $freight) use ($showScheduledTime): string {
                $parts = [
                    $freight->truck_plate,
                    $freight->user?->name,
                ];

                if ($showScheduledTime && $freight->timeslot?->start_time) {
                    $parts[] = $freight->timeslot->start_time->format('H:i');
                } else {
                    $parts[] = $freight->status->label();
                }

                return '• '.implode(' · ', array_values(array_filter($parts)));
            })
            ->all();
    }

    private function resolveClient(Company $company, string $name): array
    {
        $needle = $this->normalizeName($name);

        if ($needle === '') {
            return ['client' => null, 'error' => 'Qual cliente você quer consultar?'];
        }

        $clients = User::query()
            ->where('company_id', $company->id)
            ->where('role', User::ROLE_CLIENT)
            ->orderBy('name')
            ->get();
        $exact = $clients
            ->filter(fn (User $client): bool => $this->normalizeName($client->name) === $needle)
            ->values();

        if ($exact->count() === 1) {
            return ['client' => $exact->first(), 'error' => null];
        }

        $similar = mb_strlen($needle) >= 3
            ? $clients->filter(function (User $client) use ($needle): bool {
                $candidate = $this->normalizeName($client->name);

                return str_contains($candidate, $needle) || str_contains($needle, $candidate);
            })->values()
            : collect();

        if ($similar->count() === 1) {
            return ['client' => $similar->first(), 'error' => null];
        }

        if ($exact->count() > 1 || $similar->count() > 1) {
            $matches = ($exact->isNotEmpty() ? $exact : $similar)->take(5)->pluck('name')->implode(', ');

            return ['client' => null, 'error' => "Encontrei mais de um cliente: {$matches}. Informe o nome completo."];
        }

        return ['client' => null, 'error' => "Não encontrei o cliente \"{$name}\" nesta empresa."];
    }

    private function normalizeName(string $value): string
    {
        $value = Str::ascii(mb_strtolower($value));
        $value = preg_replace('/[^a-z0-9]+/', ' ', $value) ?? $value;
        $value = preg_replace('/^cliente\s+/', '', trim($value)) ?? trim($value);

        return Str::of($value)->squish()->toString();
    }

    private function queryDate(string $value, CarbonImmutable $now): ?CarbonImmutable
    {
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) !== 1) {
            return null;
        }

        try {
            $date = CarbonImmutable::createFromFormat('!Y-m-d', $value, config('app.timezone'));
        } catch (Throwable) {
            return null;
        }

        if ($date === false || $date->format('Y-m-d') !== $value) {
            return null;
        }

        return abs($date->diffInDays($now->startOfDay(), false)) <= 31 ? $date : null;
    }

    private function dayRange(CarbonImmutable $date): array
    {
        return [$date->startOfDay(), $date->endOfDay()];
    }

    private function dayLabel(
        CarbonImmutable $date,
        CarbonImmutable $now,
        bool $lowercase = false,
    ): string {
        $label = match (true) {
            $date->isSameDay($now) => 'Hoje',
            $date->isSameDay($now->addDay()) => 'Amanhã',
            $date->isSameDay($now->subDay()) => 'Ontem',
            default => $date->format('d/m/Y'),
        };

        return $lowercase ? mb_strtolower($label) : $label;
    }

    private function updatedAt(CarbonImmutable $now, bool $leadingSpace = true): string
    {
        return ($leadingSpace ? ' ' : '').'Atualizado às '.$now->format('H:i').'.';
    }

    private function remainingLabel(int $total): ?string
    {
        return $total > 5 ? '• +'.($total - 5).' outros' : null;
    }

    private function durationLabel(float $minutes): string
    {
        $roundedMinutes = (int) round($minutes);

        if ($roundedMinutes < 60) {
            return number_format($minutes, 1, ',', '.').' min';
        }

        $hours = intdiv($roundedMinutes, 60);
        $remaining = $roundedMinutes % 60;

        return $remaining > 0 ? "{$hours}h {$remaining}min" : "{$hours}h";
    }

    private function success(string $text, array $payload): array
    {
        return ['ok' => true, 'text' => $text, 'payload' => $payload];
    }

    private function failure(string $text, array $payload): array
    {
        return ['ok' => false, 'text' => $text, 'payload' => $payload];
    }

    private function unsupported(): array
    {
        return $this->failure(implode("\n", [
            'Ainda não consigo responder essa pergunta no piloto.',
            'Você pode perguntar, por exemplo:',
            '• Quantas cotas ainda temos hoje?',
            '• Quantos veículos estão no pátio?',
            '• Quais veículos estão atrasados?',
            '• Quais docas estão livres?',
            '• Faça um resumo da operação de hoje.',
        ]), ['reason' => 'unsupported_intent']);
    }
}
