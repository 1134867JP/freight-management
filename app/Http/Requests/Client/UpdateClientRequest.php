<?php

namespace App\Http\Requests\Client;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        $objUser = $this->user();

        return $objUser && $objUser->isAdmin();
    }

    public function rules(): array
    {
        $objRouteUser = $this->route('user');
        $idUser = $objRouteUser?->id ?? 'NULL';

        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$idUser,
            'password' => 'nullable|string|min:8',
        ];
    }
}
