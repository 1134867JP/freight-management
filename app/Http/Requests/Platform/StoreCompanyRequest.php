<?php

namespace App\Http\Requests\Platform;

use App\Models\User;
use App\Support\WhatsAppPhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        $objUser = $this->user();

        return $objUser && $objUser->isPlatformAdmin();
    }

    public function rules(): array
    {
        return [
            'company_name' => ['required', 'string', 'max:255'],
            'company_slug' => ['nullable', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('companies', 'slug')],
            'company_is_active' => ['required', 'boolean'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'remove_logo' => ['nullable', 'boolean'],

            'admin_name' => ['required', 'string', 'max:255'],
            'admin_email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class, 'email')],
            'admin_password' => ['required', 'string', 'min:8'],
            'admin_whatsapp_phone' => ['nullable', 'regex:/^\d{10,15}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'company_slug.regex' => 'Use apenas letras minúsculas, números e hífens no slug.',
            'admin_whatsapp_phone.regex' => 'Informe o WhatsApp do admin com DDI e apenas números.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'company_is_active' => $this->boolean('company_is_active'),
            'remove_logo' => $this->boolean('remove_logo'),
            'admin_whatsapp_phone' => $this->exists('admin_whatsapp_phone')
                ? WhatsAppPhone::normalize($this->input('admin_whatsapp_phone'))
                : null,
        ]);
    }
}
