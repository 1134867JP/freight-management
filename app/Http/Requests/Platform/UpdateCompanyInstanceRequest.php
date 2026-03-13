<?php

namespace App\Http\Requests\Platform;

use App\Models\WhatsAppInstance;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanyInstanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $objUser = $this->user();

        return $objUser && $objUser->isPlatformAdmin();
    }

    public function rules(): array
    {
        $company = $this->route('company');
        $instance = $company?->whatsappInstance;

        return [
            'instance_label' => ['required', 'string', 'max:255'],
            'instance_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique(WhatsAppInstance::class, 'instance_name')->ignore($instance?->id),
            ],
            'instance_base_url' => ['required', 'url', 'max:255'],
            'instance_api_key' => ['nullable', 'string', 'max:255'],
            'instance_is_active' => ['required', 'boolean'],
            'clear_instance_api_key' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $company = $this->route('company');
            $instance = $company?->whatsappInstance;

            if ($this->boolean('clear_instance_api_key')) {
                return;
            }

            if (filled($this->input('instance_api_key')) || filled($instance?->api_key)) {
                return;
            }

            $validator->errors()->add('instance_api_key', 'Informe a API Key da instância.');
        });
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'instance_is_active' => $this->boolean('instance_is_active'),
            'clear_instance_api_key' => $this->boolean('clear_instance_api_key'),
        ]);
    }
}
