<?php

namespace Tests\Feature;

use App\Actions\Quota\BookQuota;
use App\Actions\Quota\PublishQuota;
use App\Models\Company;
use App\Models\Quota;
use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Dois clientes disputando a última cota em horários DIFERENTES: o lock da
 * cota (e não só o do horário) é o que impede o overbooking.
 */
class PostgresQuotaConcurrencyTest extends TestCase
{
    use DatabaseMigrations;

    public function test_two_clients_cannot_take_the_same_last_quota_unit(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            $this->markTestSkipped('Este teste de concorrência exige PostgreSQL.');
        }

        if (! function_exists('pcntl_fork')) {
            $this->markTestSkipped('A extensão pcntl é necessária para o teste concorrente.');
        }

        $company = Company::factory()->create();
        $admin = User::factory()->forCompany($company)->create(['role' => User::ROLE_COMPANY_ADMIN]);
        $clientIds = collect([1, 2])
            ->map(fn () => User::factory()->forCompany($company)->create(['role' => User::ROLE_CLIENT])->id)
            ->all();

        $quota = app(PublishQuota::class)->execute($admin, [
            'product_name' => 'Soja',
            'destination' => 'B&8',
            'operation_type' => 'unload',
            'total_quantity' => 1,
            'starts_on' => now()->addDay()->toDateString(),
            'ends_on' => now()->addDay()->toDateString(),
            'hours' => ['08:00', '09:00'],
            'slot_capacity' => 5,
            'requires_invoice' => true,
            'requires_weight_ticket' => true,
        ]);

        $slotIds = Timeslot::query()->where('quota_id', $quota->id)->orderBy('start_time')->pluck('id')->all();

        $runDirectory = sys_get_temp_dir().'/cargohub-quota-concurrency-'.bin2hex(random_bytes(8));
        mkdir($runDirectory, 0700, true);
        $startSignal = $runDirectory.'/start';
        $children = [];

        DB::disconnect();

        foreach ($clientIds as $index => $clientId) {
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

                    app(BookQuota::class)->execute(
                        User::query()->findOrFail($clientId),
                        Quota::query()->findOrFail($quota->id),
                        Timeslot::query()->findOrFail($slotIds[$index]),
                    );
                    file_put_contents($runDirectory.'/result-'.$index, 'success');
                } catch (\Throwable $exception) {
                    file_put_contents($runDirectory.'/result-'.$index, 'rejected:'.get_class($exception).':'.$exception->getMessage());
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

        $results = collect([0, 1])->map(fn (int $index): string => (string) file_get_contents($runDirectory.'/result-'.$index));

        foreach (glob($runDirectory.'/*') ?: [] as $file) {
            unlink($file);
        }
        rmdir($runDirectory);

        DB::reconnect();

        $diagnostic = $results->implode(PHP_EOL);

        $this->assertSame(1, $results->filter(fn (string $r): bool => $r === 'success')->count(), $diagnostic);
        $this->assertSame(1, $results->filter(fn (string $r): bool => str_starts_with($r, 'rejected:App\\Exceptions\\Freight\\QuotaUnavailableException'))->count(), $diagnostic);
        $this->assertSame(1, DB::table('freights')->where('quota_id', $quota->id)->count());
    }
}
