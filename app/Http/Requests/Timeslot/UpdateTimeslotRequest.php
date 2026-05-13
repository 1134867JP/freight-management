<?php

namespace App\Http\Requests\Timeslot;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateTimeslotRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        return $user && $user->isCompanyAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $idCompany = $this->user()?->company_id;
        $usesDocks = $this->user()?->company?->uses_docks ?? true;

        return [
            'start_time'         => 'required|date',
            'end_time'           => 'required|date|after:start_time',
            'operation_type'     => 'required|in:load,unload,both',
            'capacity'           => 'required|integer|min:1',
            'description'        => 'nullable|string|max:255',
            'status'             => 'required|in:available,full,closed',
            'modelo'             => ['required', Rule::in($usesDocks
                ? ['aberta', 'por_produto', 'por_produto_doca']
                : ['aberta', 'por_produto'])],
            'produto_id'         => ['nullable', Rule::exists('produtos', 'id')->where('company_id', $idCompany)],
            'doca_id'            => ['nullable', Rule::exists('docas', 'id')->where('company_id', $idCompany)],
            'dropoff_address_id' => ['nullable', Rule::exists('dropoff_addresses', 'id')->where('company_id', $idCompany)],
            'client_ids'         => 'nullable|array',
            'client_ids.*'       => [Rule::exists('users', 'id')
                ->where('company_id', $idCompany)
                ->where('role', User::ROLE_CLIENT)],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $strModelo = $this->input('modelo');

            if (in_array($strModelo, ['por_produto', 'por_produto_doca']) && ! $this->input('produto_id')) {
                $v->errors()->add('produto_id', 'O produto é obrigatório para este modelo de cota.');
            }

            if ($strModelo === 'por_produto_doca' && ! $this->input('doca_id')) {
                $v->errors()->add('doca_id', 'A doca é obrigatória para este modelo de cota.');
            }
        });
    }

    /**
     * Get the error messages for validation failures.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'start_time.required' => 'A data/hora de início é obrigatória.',
            'start_time.date' => 'A data/hora de início deve ser uma data válida.',
            'end_time.required' => 'A data/hora de término é obrigatória.',
            'end_time.date' => 'A data/hora de término deve ser uma data válida.',
            'end_time.after' => 'A data/hora de término deve ser após a data/hora de início.',
            'operation_type.required' => 'O tipo de operação é obrigatório.',
            'operation_type.in' => 'O tipo de operação deve ser Carga, Descarga ou Ambos.',
            'capacity.required' => 'A capacidade é obrigatória.',
            'capacity.integer' => 'A capacidade deve ser um número inteiro.',
            'capacity.min' => 'A capacidade deve ser de pelo menos 1.',
            'status.required' => 'O status é obrigatório.',
            'status.in' => 'O status deve ser Disponível, Lotado ou Fechado.',
            'modelo.required' => 'O modelo da cota é obrigatório.',
            'modelo.in' => 'O modelo deve ser Aberta, Por Produto ou Por Produto + Doca.',
            'produto_id.exists' => 'O produto selecionado não existe.',
            'doca_id.exists' => 'A doca selecionada não existe.',
            'dropoff_address_id.exists' => 'O endereço de descarga selecionado não existe.',
            'client_ids.array' => 'Os clientes devem ser um array.',
            'client_ids.*.exists' => 'Um ou mais clientes selecionados não existem.',
        ];
    }
}
