<?php

namespace App\Http\Requests\Freight;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreFreightRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var \App\Models\User|null $objUser */
        $objUser = Auth::user();

        return $objUser && $objUser->isClient();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'operation_type' => ['required', 'in:load,unload'],
            'truck_plate' => ['required', 'string', 'max:10'],
            'driver_name' => ['required', 'string', 'max:100'],
            'cargo_description' => ['required', 'string', 'max:500'],
            'weight' => ['nullable', 'numeric', 'min:0.1'],
            'invoice_path' => ['nullable', 'required_if:operation_type,unload', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }

    /**
     * Get the error messages for validation failures.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'truck_plate.required' => 'A placa do caminhão é obrigatória.',
            'truck_plate.string' => 'A placa deve ser um texto.',
            'truck_plate.max' => 'A placa não pode ter mais de 10 caracteres.',

            'driver_name.required' => 'O nome do motorista é obrigatório.',
            'driver_name.string' => 'O nome deve ser um texto.',
            'driver_name.max' => 'O nome não pode ter mais de 100 caracteres.',

            'cargo_description.required' => 'A descrição da carga é obrigatória.',
            'cargo_description.string' => 'A descrição deve ser um texto.',
            'cargo_description.max' => 'A descrição não pode ter mais de 500 caracteres.',

            'operation_type.required' => 'O tipo de operação é obrigatório.',
            'operation_type.in' => 'O tipo deve ser Carga ou Descarga.',

            'weight.numeric' => 'O peso deve ser um número.',
            'weight.min' => 'O peso deve ser maior que zero.',

            'invoice_path.required_if' => 'A nota fiscal é obrigatória para descarga.',
            'invoice_path.file' => 'A nota fiscal deve ser um arquivo.',
            'invoice_path.mimes' => 'A nota fiscal deve ser PDF ou imagem (JPG, PNG).',
            'invoice_path.max' => 'A nota fiscal não pode ter mais de 10MB.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('truck_plate')) {
            $this->merge([
                'truck_plate' => strtoupper($this->truck_plate),
            ]);
        }
    }
}
