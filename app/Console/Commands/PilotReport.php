<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Services\Pilot\PilotMetrics;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

class PilotReport extends Command
{
    protected $signature = 'pilot:report
        {company : ID ou slug da empresa piloto}
        {--from= : Início ISO-8601; padrão 7 dias atrás}
        {--to= : Fim ISO-8601; padrão agora}
        {--manual-file=storage/app/pilot/manual-observations.csv : CSV de tarefas e falhas observadas}';

    protected $description = 'Consolida volume, tempos, falhas e tarefas manuais do piloto';

    public function handle(PilotMetrics $metrics): int
    {
        $identifier = (string) $this->argument('company');
        $company = Company::query()
            ->where('slug', $identifier)
            ->when(ctype_digit($identifier), fn ($query) => $query->orWhereKey((int) $identifier))
            ->first();

        if (! $company) {
            $this->error('Empresa piloto não encontrada.');

            return self::FAILURE;
        }

        try {
            $from = filled($this->option('from'))
                ? CarbonImmutable::parse($this->option('from'))
                : CarbonImmutable::now()->subDays(7)->startOfDay();
            $to = filled($this->option('to'))
                ? CarbonImmutable::parse($this->option('to'))
                : CarbonImmutable::now();
        } catch (\Throwable) {
            $this->error('Período inválido. Use datas ISO-8601.');

            return self::FAILURE;
        }

        if ($from->gt($to)) {
            $this->error('A data inicial não pode ser posterior à data final.');

            return self::FAILURE;
        }

        $manualFile = (string) $this->option('manual-file');
        $manualPath = str_starts_with($manualFile, '/') ? $manualFile : base_path($manualFile);
        $report = $metrics->build($company, $from, $to, $manualPath);

        $this->line(json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        return self::SUCCESS;
    }
}
