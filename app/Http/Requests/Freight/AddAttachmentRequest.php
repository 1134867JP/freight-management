<?php

namespace App\Http\Requests\Freight;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class AddAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'attachment' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'attachment.required' => 'O arquivo é obrigatório.',
            'attachment.file'     => 'O campo deve ser um arquivo.',
            'attachment.mimes'    => 'O arquivo deve ser PDF, imagem ou documento Word.',
            'attachment.max'      => 'O arquivo não pode ter mais de 10MB.',
        ];
    }
}
