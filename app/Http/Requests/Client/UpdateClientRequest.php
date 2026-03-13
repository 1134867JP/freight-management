<?php

namespace App\Http\Requests\Client;

use App\Models\User;
use App\Support\WhatsAppPhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        $objUser = $this->user();

        return $objUser && $objUser->isCompanyAdmin();
    }

    public function rules(): array
    {
        $objRouteUser = $this->route('user');
        $idUser = $objRouteUser?->id;

        return [
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class, 'email')->ignore($idUser),
            ],
            'password' => 'nullable|string|min:8',
            'whatsapp_phone' => ['nullable', 'regex:/^\d{10,15}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'whatsapp_phone.regex' => 'Informe o WhatsApp com DDI e apenas números. Ex.: 5511999999999.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->exists('whatsapp_phone')) {
            $this->merge([
                'whatsapp_phone' => WhatsAppPhone::normalize($this->input('whatsapp_phone')),
            ]);
        }
    }
}
