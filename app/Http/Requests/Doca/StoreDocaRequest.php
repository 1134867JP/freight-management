<?php

namespace App\Http\Requests\Doca;

use App\Enums\DocaStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class StoreDocaRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var \App\Models\User|null $objUser */
        $objUser = Auth::user();

        return $objUser && $objUser->isCompanyAdmin();
    }

    public function rules(): array
    {
        $companyId = Auth::user()?->company_id;

        return [
            'nome'      => ['required', 'string', 'max:100'],
            'codigo'    => [
                'required', 'string', 'max:20',
                Rule::unique('docas')->where('company_id', $companyId),
            ],
            'descricao' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
            'status'    => ['nullable', new Enum(DocaStatus::class)],
        ];
    }

    public function messages(): array
    {
        return [
            'nome.required'    => 'O nome da doca é obrigatório.',
            'nome.max'         => 'O nome não pode ter mais de 100 caracteres.',
            'codigo.required'  => 'O código da doca é obrigatório.',
            'codigo.max'       => 'O código não pode ter mais de 20 caracteres.',
            'codigo.unique'    => 'Já existe uma doca com este código nesta empresa.',
            'descricao.max'    => 'A descrição não pode ter mais de 500 caracteres.',
        ];
    }
}
