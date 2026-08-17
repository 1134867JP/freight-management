<?php

namespace Tests\Feature;

use App\Enums\FreightStatus;
use App\Jobs\SendWhatsAppMessageJob;
use App\Models\Company;
use App\Models\Freight;
use App\Models\Timeslot;
use App\Models\User;
use App\Models\WhatsAppCommand;
use App\Models\WhatsAppInstance;
use App\Models\WhatsAppOutboxMessage;
use App\Support\YmsAssistantIntent;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class WhatsAppYmsAssistantTest extends TestCase
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
        config()->set('services.yms_assistant.enabled', true);
        config()->set('services.yms_assistant.provider', 'groq');
        config()->set('services.yms_assistant.fallback_providers', ['gemini']);
        config()->set('services.yms_assistant.base_url', 'https://api.groq.test/openai/v1');
        config()->set('services.yms_assistant.api_key', 'test-groq-key');
        config()->set('services.yms_assistant.model', 'openai/gpt-oss-20b');
        config()->set('services.yms_assistant.per_user_per_minute', 20);
        config()->set('services.yms_assistant.global_per_minute', 100);
        config()->set('services.yms_assistant.daily_limit', 300);

        $now = CarbonImmutable::create(2026, 8, 11, 9, 0, 0, 'America/Sao_Paulo');
        Carbon::setTestNow($now);
        CarbonImmutable::setTestNow($now);
        Queue::fake([SendWhatsAppMessageJob::class]);

        $this->company = Company::factory()->create([
            'name' => 'CargoHub Piloto',
            'slug' => 'cargohub-piloto',
            'pilot_mode' => true,
        ]);
        $this->instance = WhatsAppInstance::create([
            'company_id' => $this->company->id,
            'name' => 'CargoHub Piloto',
            'instance_name' => 'cargohub-piloto',
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

    public function test_assistant_answers_capacity_from_tenant_data_without_mutating_operation(): void
    {
        $timeslot = $this->createTimeslot($this->company, $this->admin, 5);
        $this->createFreight($this->company, $this->client, $timeslot, 'AAA1A11');
        $this->createFreight($this->company, $this->client, $timeslot, 'BBB2B22');

        $otherCompany = Company::factory()->create(['slug' => 'outra-empresa']);
        $otherAdmin = User::factory()->forCompany($otherCompany)->create([
            'role' => User::ROLE_COMPANY_ADMIN,
        ]);
        $this->createTimeslot($otherCompany, $otherAdmin, 100);

        $this->fakeClassification(YmsAssistantIntent::TIMESLOT_CAPACITY);
        $timeslotCount = Timeslot::query()->count();
        $freightCount = Freight::query()->count();

        $payload = $this->payload('assistant-capacity', 'Quantas cotas ainda temos hoje?');
        $this->sendWebhook($payload)->assertOk();
        $this->sendWebhook($payload)->assertOk();

        $command = WhatsAppCommand::query()->sole();

        $this->assertSame('assistant_timeslot_capacity', $command->intent);
        $this->assertSame(WhatsAppCommand::STATUS_EXECUTED, $command->status);
        $this->assertSame('ai', $command->parsed_payload['interpreter']['source']);
        $this->assertSame(5, $command->parsed_payload['result']['total_capacity']);
        $this->assertSame(3, $command->parsed_payload['result']['available']);
        $this->assertSame($timeslotCount, Timeslot::query()->count());
        $this->assertSame($freightCount, Freight::query()->count());

        Queue::assertPushed(SendWhatsAppMessageJob::class, function (SendWhatsAppMessageJob $job): bool {
            $outbox = WhatsAppOutboxMessage::query()->findOrFail($job->outboxMessageId);

            return $outbox->company_id === $this->company->id
                && str_contains($outbox->message, 'restam 3 de 5 cotas')
                && str_contains($outbox->message, 'Atualizado às 09:00');
        });
        Queue::assertPushed(SendWhatsAppMessageJob::class, 1);
        Http::assertSentCount(1);
    }

    public function test_employee_needs_separate_permission_to_query_assistant(): void
    {
        $employee = User::factory()->forCompany($this->company)->create([
            'role' => User::ROLE_COMPANY_EMPLOYEE,
            'whatsapp_phone' => '5554888888888',
            'permissions' => User::defaultEmployeePermissions(),
        ]);
        $this->fakeClassification(YmsAssistantIntent::YARD_VEHICLES);

        $this->sendWebhook($this->payload(
            'employee-denied',
            'Quantos veículos estão no pátio?',
            $employee->whatsapp_phone,
        ))->assertOk();

        $this->assertDatabaseCount('whatsapp_commands', 0);
        Queue::assertNothingPushed();
        Http::assertNothingSent();

        $employee->update([
            'permissions' => [
                ...User::defaultEmployeePermissions(),
                User::PERMISSION_USE_YMS_ASSISTANT => true,
            ],
        ]);

        $this->sendWebhook($this->payload(
            'employee-allowed',
            'Quantos veículos estão no pátio?',
            $employee->whatsapp_phone,
        ))->assertOk();

        $this->assertDatabaseHas('whatsapp_commands', [
            'company_id' => $this->company->id,
            'user_id' => $employee->id,
            'external_message_id' => 'employee-allowed',
            'intent' => 'assistant_yard_vehicles',
            'status' => WhatsAppCommand::STATUS_EXECUTED,
        ]);
        $this->assertFalse($employee->fresh()->hasPermission(User::PERMISSION_CREATE_TIMESLOTS_VIA_WHATSAPP));
        Queue::assertPushed(SendWhatsAppMessageJob::class, 1);
    }

    public function test_provider_failure_uses_deterministic_fallback(): void
    {
        $this->createTimeslot($this->company, $this->admin, 4);
        Http::fake([
            'https://api.groq.test/*' => Http::response(['error' => ['message' => 'rate limit']], 429),
        ]);

        $this->sendWebhook($this->payload(
            'assistant-fallback',
            'Quantas cotas ainda temos hoje?',
        ))->assertOk();

        $command = WhatsAppCommand::query()->sole();

        $this->assertSame(WhatsAppCommand::STATUS_EXECUTED, $command->status);
        $this->assertSame('rules', $command->parsed_payload['interpreter']['source']);
        $this->assertSame(4, $command->parsed_payload['result']['available']);
        Queue::assertPushed(SendWhatsAppMessageJob::class, function (SendWhatsAppMessageJob $job): bool {
            return str_contains(
                WhatsAppOutboxMessage::query()->findOrFail($job->outboxMessageId)->message,
                'restam 4 de 4 cotas',
            );
        });
    }

    public function test_groq_failure_uses_gemini_before_deterministic_fallback(): void
    {
        config()->set('services.yms_assistant.gemini.base_url', 'https://gemini.test/v1beta');
        config()->set('services.yms_assistant.gemini.api_key', 'test-gemini-key');
        config()->set('services.yms_assistant.gemini.model', 'gemini-2.5-flash');
        $this->createTimeslot($this->company, $this->admin, 4);

        Http::fake([
            'https://api.groq.test/*' => Http::response([
                'error' => ['message' => 'rate limit'],
            ], 429),
            'https://gemini.test/*' => Http::response([
                'candidates' => [[
                    'content' => [
                        'parts' => [[
                            'text' => json_encode([
                                'intent' => YmsAssistantIntent::TIMESLOT_CAPACITY,
                                'date' => '2026-08-11',
                                'client_name' => '',
                            ], JSON_THROW_ON_ERROR),
                        ]],
                    ],
                ]],
                'usageMetadata' => [
                    'promptTokenCount' => 70,
                    'candidatesTokenCount' => 10,
                ],
            ]),
        ]);

        $this->sendWebhook($this->payload(
            'assistant-gemini-fallback',
            'Quantas cotas ainda temos hoje?',
        ))->assertOk();

        $command = WhatsAppCommand::query()->sole();

        $this->assertSame(WhatsAppCommand::STATUS_EXECUTED, $command->status);
        $this->assertSame('ai', $command->parsed_payload['interpreter']['source']);
        $this->assertSame('gemini', $command->parsed_payload['interpreter']['provider']);
        $this->assertSame(1, $command->parsed_payload['interpreter']['fallback_index']);
        $this->assertSame('groq', $command->parsed_payload['interpreter']['fallback_from']);
        $this->assertSame(4, $command->parsed_payload['result']['available']);
        Http::assertSentCount(2);
        Queue::assertPushed(SendWhatsAppMessageJob::class, 1);
    }

    public function test_internal_free_tier_limit_uses_fallback_without_another_ai_call(): void
    {
        config()->set('services.yms_assistant.global_per_minute', 1);
        RateLimiter::clear('yms-assistant:minute:global');
        $this->createTimeslot($this->company, $this->admin, 4);
        $this->fakeClassification(YmsAssistantIntent::TIMESLOT_CAPACITY);

        $this->sendWebhook($this->payload(
            'assistant-with-ai',
            'Quantas cotas ainda temos hoje?',
        ))->assertOk();
        $this->sendWebhook($this->payload(
            'assistant-with-rules',
            'Quantas cotas ainda temos hoje?',
        ))->assertOk();

        $commands = WhatsAppCommand::query()->orderBy('id')->get();

        $this->assertCount(2, $commands);
        $this->assertSame('ai', $commands[0]->parsed_payload['interpreter']['source']);
        $this->assertSame('rules', $commands[1]->parsed_payload['interpreter']['source']);
        Http::assertSentCount(1);
        Queue::assertPushed(SendWhatsAppMessageJob::class, 2);
    }

    public function test_creation_command_keeps_confirmation_flow_instead_of_using_ai(): void
    {
        Http::fake();

        $this->sendWebhook($this->payload(
            'create-timeslot',
            'Criar 10 cotas às 10h no cliente X amanhã',
        ))->assertOk();

        $this->assertDatabaseHas('whatsapp_commands', [
            'external_message_id' => 'create-timeslot',
            'intent' => 'create_timeslot',
            'status' => WhatsAppCommand::STATUS_PENDING_CONFIRMATION,
        ]);
        $this->assertDatabaseCount('timeslots', 0);
        Http::assertNothingSent();
        Queue::assertPushed(SendWhatsAppMessageJob::class, function (SendWhatsAppMessageJob $job): bool {
            return str_contains(
                WhatsAppOutboxMessage::query()->findOrFail($job->outboxMessageId)->message,
                'Responda CONFIRMAR',
            );
        });
    }

    private function createTimeslot(Company $company, User $creator, int $capacity): Timeslot
    {
        return Timeslot::create([
            'company_id' => $company->id,
            'start_time' => CarbonImmutable::now()->setTime(10, 0),
            'end_time' => CarbonImmutable::now()->setTime(11, 0),
            'operation_type' => 'both',
            'capacity' => $capacity,
            'status' => Timeslot::STATUS_AVAILABLE,
            'description' => 'Teste do gerente YMS',
            'modelo' => Timeslot::MODELO_ABERTA,
            'created_by' => $creator->id,
        ]);
    }

    private function createFreight(
        Company $company,
        User $client,
        Timeslot $timeslot,
        string $plate,
    ): Freight {
        return Freight::create([
            'company_id' => $company->id,
            'user_id' => $client->id,
            'timeslot_id' => $timeslot->id,
            'operation_type' => 'load',
            'truck_plate' => $plate,
            'status' => FreightStatus::Reserved->value,
        ]);
    }

    private function fakeClassification(string $intent, string $clientName = ''): void
    {
        Http::fake([
            'https://api.groq.test/openai/v1/chat/completions' => Http::response([
                'choices' => [[
                    'message' => [
                        'content' => json_encode([
                            'intent' => $intent,
                            'date' => '2026-08-11',
                            'client_name' => $clientName,
                        ], JSON_THROW_ON_ERROR),
                    ],
                ]],
                'usage' => ['prompt_tokens' => 100, 'completion_tokens' => 15],
            ]),
        ]);
    }

    private function sendWebhook(array $payload): TestResponse
    {
        return $this->postJson(route('webhooks.evolution'), $payload, [
            'Authorization' => 'Bearer test-webhook-secret',
        ]);
    }

    private function payload(
        string $messageId,
        string $text,
        string $phone = '5554999999999',
    ): array {
        return [
            'event' => 'MESSAGES_UPSERT',
            'instance' => $this->instance->instance_name,
            'data' => [
                'key' => [
                    'remoteJid' => $phone.'@s.whatsapp.net',
                    'fromMe' => false,
                    'id' => $messageId,
                ],
                'message' => ['conversation' => $text],
                'messageType' => 'conversation',
                'messageTimestamp' => 1786449600,
            ],
            'sender' => $phone.'@s.whatsapp.net',
        ];
    }
}
