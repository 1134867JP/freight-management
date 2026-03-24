<?php

namespace App\Http\Requests\Freight;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UploadInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::user()?->isClient() ?? false;
    }

    public function rules(): array
    {
        return [
            'nota_fiscal'  => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'gross_weight' => ['nullable', 'numeric', 'min:0.01'],
        ];
    }

    public function messages(): array
    {
        return [
            'nota_fiscal.required' => 'A nota fiscal é obrigatória.',
            'nota_fiscal.file'     => 'A nota fiscal deve ser um arquivo.',
            'nota_fiscal.mimes'    => 'A nota fiscal deve ser PDF ou imagem (JPG, PNG).',
            'nota_fiscal.max'      => 'A nota fiscal não pode ter mais de 10MB.',
            'gross_weight.numeric' => 'O peso bruto deve ser um número.',
            'gross_weight.min'     => 'O peso bruto deve ser maior que zero.',
        ];
    }
}
