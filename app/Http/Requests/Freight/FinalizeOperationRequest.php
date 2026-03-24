<?php

namespace App\Http\Requests\Freight;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class FinalizeOperationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'gross_weight' => ['required', 'numeric', 'min:0.01'],
            'net_weight'   => ['required', 'numeric', 'min:0.01'],
            'admin_notes'  => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'gross_weight.required' => 'O peso bruto é obrigatório.',
            'gross_weight.numeric'  => 'O peso bruto deve ser um número.',
            'gross_weight.min'      => 'O peso bruto deve ser maior que zero.',
            'net_weight.required'   => 'O peso líquido é obrigatório.',
            'net_weight.numeric'    => 'O peso líquido deve ser um número.',
            'net_weight.min'        => 'O peso líquido deve ser maior que zero.',
            'admin_notes.max'       => 'As observações não podem ter mais de 500 caracteres.',
        ];
    }
}
