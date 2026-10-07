<?php

namespace App\Http\Requests\Quota;

use Illuminate\Foundation\Http\FormRequest;

class BookQuotaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isClient();
    }

    public function rules(): array
    {
        return [
            'timeslot_id' => ['required', 'integer'],
            'quantity' => ['required', 'integer', 'min:1', 'max:200'],
            'truck_plate' => ['nullable', 'string', 'max:10'],
            'driver_name' => ['nullable', 'required_with:truck_plate', 'string', 'max:100'],
            'driver_phone' => ['nullable', 'string', 'max:20'],
            'weight_tons' => ['nullable', 'numeric', 'min:0.1', 'max:1000'],
            'invoice_number' => ['nullable', 'string', 'max:60'],
        ];
    }

    public function messages(): array
    {
        return [
            'timeslot_id.required' => 'Escolha um horário.',
            'quantity.min' => 'Agende ao menos 1 cota.',
            'driver_name.required_with' => 'Informe o motorista do veículo.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('truck_plate')) {
            $this->merge(['truck_plate' => strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $this->truck_plate))]);
        }
    }
}
