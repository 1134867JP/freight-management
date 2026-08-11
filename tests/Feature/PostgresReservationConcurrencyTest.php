<?php

namespace Tests\Feature;

use App\Actions\Freight\CreateReservation;
use App\Models\Company;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PostgresReservationConcurrencyTest extends TestCase
{
    use DatabaseMigrations;

    public function test_two_concurrent_requests_cannot_take_the_same_last_capacity(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Este teste de concorrência exige PostgreSQL.');
        }

        if (! function_exists('pcntl_fork')) {
            $this->markTestSkipped('A extensão pcntl é necessária para o teste concorrente.');
        }

        $company = Company::factory()->create();
        $admin = User::factory()->forCompany($company)->create([
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);
        $clients = collect([1, 2])->map(fn () => User::factory()->forCompany($company)->create([
            'role' => User::ROLE_CLIENT,
        ]));
        $timeslot = Timeslot::create([
            'company_id' => $company->id,
            'start_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHour(),
            'operation_type' => 'load',
            'capacity' => 1,
            'status' => Timeslot::STATUS_AVAILABLE,
            'created_by' => $admin->id,
        ]);

        $runDirectory = sys_get_temp_dir().'/cargohub-concurrency-'.bin2hex(random_bytes(8));
        mkdir($runDirectory, 0700, true);
        $startSignal = $runDirectory.'/start';
        $children = [];
        $clientIds = $clients->pluck('id')->all();
        $timeslotId = $timeslot->id;

        // Não permita que os processos filhos herdem o mesmo socket PDO. Cada
        // reserva precisa abrir sua própria conexão para reproduzir duas
        // requisições independentes concorrendo pelo lock do PostgreSQL.
        DB::disconnect();

        foreach ($clientIds as $index => $clientId) {
            $resultFile = $runDirectory.'/result-'.$index;
            $processId = pcntl_fork();

            if ($processId === -1) {
                $this->fail('Não foi possível iniciar o processo concorrente.');
            }

            if ($processId === 0) {
                while (! is_file($startSignal)) {
                    usleep(1_000);
                }

                try {
                    DB::reconnect();

                    app(CreateReservation::class)->execute(
                        User::query()->findOrFail($clientId),
                        Timeslot::query()->findOrFail($timeslotId),
                        'CON'.($index + 1).'234',
                        'Motorista '.($index + 1),
                        'Carga concorrente',
                        'load',
                    );
                    file_put_contents($resultFile, 'success');
                } catch (\Throwable $exception) {
                    file_put_contents($resultFile, implode(':', [
                        'rejected',
                        get_class($exception),
                        preg_replace('/\s+/', ' ', $exception->getMessage()),
                    ]));
                }

                exit(0);
            }

            $children[] = $processId;
        }

        touch($startSignal);

        foreach ($children as $processId) {
            pcntl_waitpid($processId, $status);
            $this->assertTrue(pcntl_wifexited($status));
        }

        $results = collect([0, 1])->map(
            fn (int $index): string => (string) file_get_contents($runDirectory.'/result-'.$index),
        );

        foreach (glob($runDirectory.'/*') ?: [] as $file) {
            unlink($file);
        }
        rmdir($runDirectory);

        DB::reconnect();

        $diagnostic = $results->implode(PHP_EOL);

        $this->assertSame(1, $results->where('success')->count(), $diagnostic);
        $this->assertSame(
            1,
            $results->filter(fn (string $result): bool => str_starts_with($result, 'rejected:'))->count(),
            $diagnostic,
        );
        $this->assertSame(1, DB::table('freights')->where('timeslot_id', $timeslot->id)->count());
    }
}
