<?php

namespace Tests\Feature;

use App\Jobs\SendWhatsAppMessageJob;
use App\Models\AuditLog;
use App\Models\Company;
use App\Models\Timeslot;
use App\Models\User;
use App\Models\WhatsAppCommand;
use App\Models\WhatsAppInstance;
use App\Models\WhatsAppOutboxMessage;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class WhatsAppTimeslotBotTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private WhatsAppInstance $instance;

    private User $admin;

    private User $client;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.evolution.bot.enabled', true);
        config()->set('services.evolution.bot.webhook_secret', 'test-webhook-secret');
        config()->set('services.evolution.bot.confirmation_ttl_minutes', 10);
        config()->set('services.evolution.bot.timeslot_duration_minutes', 60);
        config()->set('services.evolution.bot.max_capacity', 500);

        $now = CarbonImmutable::create(
            2026,
            8,
            11,
            9,
            0,
            0,
            'America/Sao_Paulo',
        );

        Carbon::setTestNow($now);
        CarbonImmutable::setTestNow($now);

        Queue::fake([SendWhatsAppMessageJob::class]);

        $this->company = Company::factory()->create([
            'name' => 'CargoHub Teste',
            'slug' => 'cargohub-teste',
        ]);

        $this->instance = WhatsAppInstance::create([
            'company_id' => $this->company->id,
            'name' => 'CargoHub Teste',
            'instance_name' => 'cargohub-teste',
            'base_url' => 'http://evolution.test',
            'api_key' => 'instance-key',
            'is_default' => true,
            'is_active' => true,
        ]);

        $this->admin = User::factory()->forCompany($this->company)->create([
            'name' => 'Administrador',
            'role' => User::ROLE_COMPANY_ADMIN,
            'whatsapp_phone' => '5554999999999',
        ]);

        $this->client = User::factory()->forCompany($this->company)->create([
            'name' => 'Cliente X',
            'role' => User::ROLE_CLIENT,
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    public function test_webhook_requires_bearer_secret(): void
    {
        $this->postJson(route('webhooks.evolution'), $this->payload('msg-1', 'AJUDA'))
            ->assertUnauthorized();

        $this->assertDatabaseCount('whatsapp_commands', 0);
    }

    public function test_authorized_admin_can_request_and_confirm_timeslot_creation(): void
    {
        $this->sendWebhook(
            $this->payload('msg-create', 'Criar 10 cotas às 10h no cliente X amanhã'),
        )->assertOk();

        $this->assertDatabaseHas('whatsapp_commands', [
            'company_id' => $this->company->id,
            'user_id' => $this->admin->id,
            'client_id' => $this->client->id,
            'external_message_id' => 'msg-create',
            'status' => WhatsAppCommand::STATUS_PENDING_CONFIRMATION,
        ]);
        $this->assertDatabaseCount('timeslots', 0);

        Queue::assertPushed(SendWhatsAppMessageJob::class, function (SendWhatsAppMessageJob $job): bool {
            $outbox = WhatsAppOutboxMessage::query()->find($job->outboxMessageId);

            return $outbox?->phone === $this->admin->whatsapp_phone
                && str_contains($outbox->message, 'Responda CONFIRMAR')
                && $outbox->company_id === $this->company->id;
        });

        $this->sendWebhook($this->payload('msg-confirm', 'CONFIRMAR'))->assertOk();

        $timeslot = Timeslot::query()->firstOrFail();

        $this->assertSame($this->company->id, $timeslot->company_id);
        $this->assertSame($this->admin->id, $timeslot->created_by);
        $this->assertSame(10, $timeslot->capacity);
        $this->assertSame('both', $timeslot->operation_type);
        $this->assertSame('2026-08-12 10:00:00', $timeslot->start_time->format('Y-m-d H:i:s'));
        $this->assertSame('2026-08-12 11:00:00', $timeslot->end_time->format('Y-m-d H:i:s'));
        $this->assertTrue($timeslot->clients()->whereKey($this->client->id)->exists());

        $this->assertDatabaseHas('whatsapp_commands', [
            'external_message_id' => 'msg-create',
            'confirmation_message_id' => 'msg-confirm',
            'timeslot_id' => $timeslot->id,
            'status' => WhatsAppCommand::STATUS_EXECUTED,
        ]);

        $this->assertTrue(AuditLog::query()
            ->where('model_type', 'Timeslot')
            ->where('model_id', $timeslot->id)
            ->where('user_id', $this->admin->id)
            ->exists());

        Queue::assertPushed(SendWhatsAppMessageJob::class, 2);
    }

    public function test_duplicate_webhook_delivery_does_not_duplicate_command_or_timeslot(): void
    {
        $request = $this->payload('msg-create', '10 cotas | Cliente X | amanhã | 10:00');

        $this->sendWebhook($request)->assertOk();
        $this->sendWebhook($request)->assertOk();

        $this->assertDatabaseCount('whatsapp_commands', 1);
        Queue::assertPushed(SendWhatsAppMessageJob::class, 1);

        $confirmation = $this->payload('msg-confirm', 'CONFIRMAR');
        $this->sendWebhook($confirmation)->assertOk();
        $this->sendWebhook($confirmation)->assertOk();

        $this->assertDatabaseCount('timeslots', 1);
        Queue::assertPushed(SendWhatsAppMessageJob::class, 2);
    }

    public function test_cancel_command_does_not_create_timeslot(): void
    {
        $this->sendWebhook(
            $this->payload('msg-create', '10 cotas | Cliente X | amanhã | 10:00'),
        )->assertOk();
        $this->sendWebhook($this->payload('msg-cancel', 'CANCELAR'))->assertOk();

        $this->assertDatabaseCount('timeslots', 0);
        $this->assertDatabaseHas('whatsapp_commands', [
            'external_message_id' => 'msg-create',
            'confirmation_message_id' => 'msg-cancel',
            'status' => WhatsAppCommand::STATUS_CANCELLED,
        ]);
    }

    public function test_unauthorized_sender_and_outgoing_messages_are_ignored(): void
    {
        $this->sendWebhook(
            $this->payload('msg-unknown', '10 cotas | Cliente X | amanhã | 10:00', '5554888888888'),
        )->assertOk();

        $outgoing = $this->payload('msg-outgoing', '10 cotas | Cliente X | amanhã | 10:00');
        $outgoing['data']['key']['fromMe'] = true;
        $this->sendWebhook($outgoing)->assertOk();

        $this->assertDatabaseCount('whatsapp_commands', 0);
        Queue::assertNothingPushed();
    }

    public function test_employee_needs_explicit_permission_to_create_timeslots_via_whatsapp(): void
    {
        $employee = User::factory()->forCompany($this->company)->create([
            'role' => User::ROLE_COMPANY_EMPLOYEE,
            'whatsapp_phone' => '5554888888888',
            'permissions' => User::defaultEmployeePermissions(),
        ]);

        $this->sendWebhook(
            $this->payload('msg-employee-denied', '10 cotas | Cliente X | amanhã | 10:00', $employee->whatsapp_phone),
        )->assertOk();

        $this->assertDatabaseCount('whatsapp_commands', 0);
        Queue::assertNothingPushed();

        $employee->update([
            'permissions' => [
                ...User::defaultEmployeePermissions(),
                User::PERMISSION_CREATE_TIMESLOTS_VIA_WHATSAPP => true,
            ],
        ]);

        $this->sendWebhook(
            $this->payload('msg-employee-authorized', '10 cotas | Cliente X | amanhã | 10:00', $employee->whatsapp_phone),
        )->assertOk();

        $this->assertDatabaseHas('whatsapp_commands', [
            'company_id' => $this->company->id,
            'user_id' => $employee->id,
            'external_message_id' => 'msg-employee-authorized',
            'status' => WhatsAppCommand::STATUS_PENDING_CONFIRMATION,
        ]);
        Queue::assertPushed(SendWhatsAppMessageJob::class, 1);

        $this->sendWebhook(
            $this->payload('msg-employee-confirm', 'CONFIRMAR', $employee->whatsapp_phone),
        )->assertOk();

        $timeslot = Timeslot::query()->firstOrFail();
        $this->assertSame($employee->id, $timeslot->created_by);
        $this->assertTrue($timeslot->clients()->whereKey($this->client->id)->exists());
        $this->assertDatabaseHas('whatsapp_commands', [
            'external_message_id' => 'msg-employee-authorized',
            'confirmation_message_id' => 'msg-employee-confirm',
            'status' => WhatsAppCommand::STATUS_EXECUTED,
        ]);
    }

    public function test_missing_date_is_rejected_without_creating_timeslot(): void
    {
        $this->sendWebhook(
            $this->payload('msg-invalid', '10 cotas às 10 no cliente Cliente X'),
        )->assertOk();

        $this->assertDatabaseHas('whatsapp_commands', [
            'external_message_id' => 'msg-invalid',
            'status' => WhatsAppCommand::STATUS_REJECTED,
        ]);
        $this->assertDatabaseCount('timeslots', 0);

        Queue::assertPushed(SendWhatsAppMessageJob::class, function (SendWhatsAppMessageJob $job): bool {
            return str_contains(
                WhatsAppOutboxMessage::query()->findOrFail($job->outboxMessageId)->message,
                'data',
            );
        });
    }

    private function sendWebhook(array $payload)
    {
        return $this->postJson(route('webhooks.evolution'), $payload, [
            'Authorization' => 'Bearer test-webhook-secret',
        ]);
    }

    private function payload(string $messageId, string $text, string $phone = '5554999999999'): array
    {
        return [
            'event' => 'MESSAGES_UPSERT',
            'instance' => $this->instance->instance_name,
            'data' => [
                'key' => [
                    'remoteJid' => $phone.'@s.whatsapp.net',
                    'fromMe' => false,
                    'id' => $messageId,
                ],
                'message' => [
                    'conversation' => $text,
                ],
                'messageType' => 'conversation',
                'messageTimestamp' => 1786449600,
            ],
            'sender' => $phone.'@s.whatsapp.net',
        ];
    }
}
