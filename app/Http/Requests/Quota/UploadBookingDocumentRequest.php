<?php

namespace App\Http\Requests\Quota;

use App\Models\FreightAttachment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadBookingDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $types = $this->user()?->isAdmin()
            ? [...FreightAttachment::CLIENT_UPLOADABLE_TYPES, FreightAttachment::TYPE_ATTACHMENT]
            : FreightAttachment::CLIENT_UPLOADABLE_TYPES;

        return [
            'type' => ['required', Rule::in($types)],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'invoice_number' => ['nullable', 'string', 'max:60'],
            'weight_tons' => ['nullable', 'numeric', 'min:0.01', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Selecione o arquivo.',
            'file.mimes' => 'Envie PDF ou imagem (JPG, PNG).',
            'file.max' => 'O arquivo pode ter no máximo 10MB.',
        ];
    }
}
