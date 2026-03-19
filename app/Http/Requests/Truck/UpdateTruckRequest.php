<?php

namespace App\Http\Requests\Truck;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTruckRequest extends FormRequest
{
    public function authorize(): bool
    {
        $objUser = $this->user();

        return $objUser && $objUser->isClient();
    }

    public function rules(): array
    {
        return [
            'plate' => [
                'required',
                'string',
                'max:7',
                'regex:/^[A-Z]{3}\d[A-Z0-9]\d{2}$/',
            ],
            'type' => 'required|string|max:20',
            'model' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
            'is_active' => 'required|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'plate.regex' => 'A placa deve estar no formato ABC1234 ou ABC1D23 (Mercosul).',
        ];
    }
}
