<?php

namespace Tests\Unit;

use App\Models\WhatsAppInstance;
use App\Services\WhatsApp\EvolutionApiClient;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class EvolutionApiClientTest extends TestCase
{
    public function test_send_text_uses_expected_evolution_endpoint_and_payload(): void
    {
        Http::fake([
            'http://localhost:8080/*' => Http::response(['status' => 'ok'], 200),
            'http://instance-host:8089/*' => Http::response(['status' => 'ok'], 200),
        ]);

        config([
            'services.evolution.enabled' => true,
            'services.evolution.base_url' => 'http://localhost:8080',
            'services.evolution.api_key' => 'test-api-key',
            'services.evolution.instance' => 'patio-principal',
            'services.evolution.timeout' => 10,
        ]);

        $response = app(EvolutionApiClient::class)->sendText('+55 (11) 91234-5678', 'Teste Evolution');

        $this->assertSame(['status' => 'ok'], $response);

        Http::assertSent(function ($request) {
            return $request->method() === 'POST'
                && $request->url() === 'http://localhost:8080/message/sendText/patio-principal'
                && $request->hasHeader('apikey', 'test-api-key')
                && $request['number'] === '5511912345678'
                && $request['text'] === 'Teste Evolution';
        });
    }

    public function test_send_text_uses_company_instance_configuration_when_provided(): void
    {
        Http::fake([
            'http://instance-host:8089/*' => Http::response(['status' => 'ok'], 200),
        ]);

        config([
            'services.evolution.enabled' => true,
            'services.evolution.base_url' => 'http://localhost:8080',
            'services.evolution.api_key' => 'global-api-key',
            'services.evolution.instance' => 'global-instance',
            'services.evolution.timeout' => 10,
        ]);

        $instance = new WhatsAppInstance([
            'name' => 'Instancia Empresa',
            'instance_name' => 'empresa-a',
            'base_url' => 'http://instance-host:8089',
            'api_key' => 'instance-api-key',
            'is_active' => true,
        ]);

        $response = app(EvolutionApiClient::class)->sendText('5511912345678', 'Teste por empresa', $instance);

        $this->assertSame(['status' => 'ok'], $response);

        Http::assertSent(function ($request) {
            return $request->method() === 'POST'
                && $request->url() === 'http://instance-host:8089/message/sendText/empresa-a'
                && $request->hasHeader('apikey', 'instance-api-key')
                && $request['number'] === '5511912345678'
                && $request['text'] === 'Teste por empresa';
        });
    }

    public function test_company_instance_can_send_even_when_global_evolution_is_disabled(): void
    {
        Http::fake([
            'http://instance-host:8089/*' => Http::response(['status' => 'ok'], 200),
        ]);

        config([
            'services.evolution.enabled' => false,
            'services.evolution.base_url' => null,
            'services.evolution.api_key' => null,
            'services.evolution.instance' => null,
            'services.evolution.timeout' => 10,
        ]);

        $instance = new WhatsAppInstance([
            'name' => 'Instancia Empresa',
            'instance_name' => 'empresa-a',
            'base_url' => 'http://instance-host:8089',
            'api_key' => 'instance-api-key',
            'is_active' => true,
        ]);

        $response = app(EvolutionApiClient::class)->sendText('5511912345678', 'Teste por empresa', $instance);

        $this->assertSame(['status' => 'ok'], $response);
        $this->assertTrue(app(EvolutionApiClient::class)->isReadyForSending($instance));

        Http::assertSent(function ($request) {
            return $request->method() === 'POST'
                && $request->url() === 'http://instance-host:8089/message/sendText/empresa-a'
                && $request->hasHeader('apikey', 'instance-api-key')
                && $request['number'] === '5511912345678'
                && $request['text'] === 'Teste por empresa';
        });
    }
}
