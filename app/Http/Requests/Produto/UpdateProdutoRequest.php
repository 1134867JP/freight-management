<?php

namespace App\Http\Requests\Produto;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateProdutoRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var \App\Models\User|null $objUser */
        $objUser = Auth::user();

        return $objUser && $objUser->isCompanyAdmin();
    }

    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:100'],
            'descricao' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'nome.required' => 'O nome do produto é obrigatório.',
            'nome.max' => 'O nome não pode ter mais de 100 caracteres.',
            'descricao.max' => 'A descrição não pode ter mais de 500 caracteres.',
        ];
    }
}
