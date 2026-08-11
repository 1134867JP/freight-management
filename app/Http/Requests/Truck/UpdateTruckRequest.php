<?php

namespace App\Http\Requests\Truck;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTruckRequest extends FormRequest
{
    public function authorize(): bool
    {
        $objUser = $this->user();

        return $objUser && $objUser->isClient();
    }

    public function rules(): array
    {
        $truck = $this->route('truck');
        $idUser = $this->user()?->id;

        return [
            'plate' => [
                'required',
                'string',
                'max:7',
                'regex:/^[A-Z]{3}\d[A-Z0-9]\d{2}$/',
                Rule::unique('trucks', 'plate')
                    ->where(fn ($query) => $query->where('user_id', $idUser))
                    ->ignore($truck?->id),
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
            'plate.unique' => 'Esta placa já está cadastrada para o seu usuário.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'plate' => strtoupper(preg_replace('/[^A-Z0-9]/i', '', (string) $this->input('plate'))),
        ]);
    }
}
