<?php

namespace App\Http\Requests\DropoffAddress;

use Illuminate\Foundation\Http\FormRequest;

class StoreDropoffAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        $objUser = $this->user();

        return $objUser && $objUser->isCompanyAdmin();
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'street' => 'required|string|max:255',
            'number' => 'required|string|max:20',
            'neighborhood' => 'required|string|max:100',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:2',
            'complement' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ];
    }
}
