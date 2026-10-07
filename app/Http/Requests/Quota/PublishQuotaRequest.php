<?php

namespace App\Http\Requests\Quota;

use App\Models\Quota;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class PublishQuotaRequest extends FormRequest
{
    public const MAX_PERIOD_DAYS = 92;

    public function authorize(): bool
    {
        return (bool) $this->user()?->isCompanyAdmin();
    }

    public function rules(): array
    {
        /** @var Quota|null $quota */
        $quota = $this->route('quota');
        $companyId = $this->user()->company_id;

        return [
            'product_name' => ['required', 'string', 'max:120'],
            'destination' => ['required', 'string', 'max:160'],
            'operation_type' => ['required', Rule::in(['load', 'unload'])],
            'total_quantity' => ['required', 'integer', 'min:1', 'max:100000'],
            'starts_on' => array_filter(['required', 'date', $quota ? null : 'after_or_equal:today']),
            'ends_on' => ['required', 'date', 'after_or_equal:starts_on'],
            'hours' => ['required', 'array', 'min:1', 'max:24'],
            'hours.*' => ['required', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'slot_capacity' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'expected_weight_tons' => ['nullable', 'numeric', 'min:0.1', 'max:1000'],
            'max_per_client' => ['nullable', 'integer', 'min:1'],
            'rules' => ['nullable', 'string', 'max:2000'],
            'requires_invoice' => ['boolean'],
            'requires_weight_ticket' => ['boolean'],
            'allocations' => ['array'],
            'allocations.*.user_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('users', 'id')->where('company_id', $companyId)->where('role', User::ROLE_CLIENT),
            ],
            'allocations.*.quantity' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $start = CarbonImmutable::parse($this->input('starts_on'));
                $end = CarbonImmutable::parse($this->input('ends_on'));

                if ($start->diffInDays($end) + 1 > self::MAX_PERIOD_DAYS) {
                    $validator->errors()->add('ends_on', 'O período de uma cota pode ter no máximo '.self::MAX_PERIOD_DAYS.' dias.');
                }

                /** @var Quota|null $quota */
                $quota = $this->route('quota');

                if ($quota && (int) $this->input('total_quantity') < $quota->occupiedUnits()) {
                    $validator->errors()->add('total_quantity', 'A quantidade não pode ser menor que as '.$quota->occupiedUnits().' cotas já agendadas.');
                }
            },
        ];
    }

    /** Dados prontos para PublishQuota, com capacidade por horário calculada quando omitida. */
    public function quotaData(): array
    {
        $data = $this->safe()->except(['allocations', 'expected_weight_tons', 'slot_capacity']);
        $days = CarbonImmutable::parse($data['starts_on'])->diffInDays(CarbonImmutable::parse($data['ends_on'])) + 1;
        $windows = max(1, (int) $days * count(array_unique($data['hours'])));

        $data['slot_capacity'] = $this->filled('slot_capacity')
            ? (int) $this->input('slot_capacity')
            : (int) max(1, ceil((int) $data['total_quantity'] / $windows));

        $data['expected_weight_kg'] = $this->filled('expected_weight_tons')
            ? round((float) $this->input('expected_weight_tons') * 1000, 2)
            : null;

        $data['requires_invoice'] = $this->boolean('requires_invoice', true);
        $data['requires_weight_ticket'] = $this->boolean('requires_weight_ticket', true);

        return $data;
    }

    public function allocations(): array
    {
        return $this->input('allocations', []);
    }

    public function messages(): array
    {
        return [
            'product_name.required' => 'Informe o produto.',
            'destination.required' => 'Informe o destino.',
            'total_quantity.required' => 'Informe quantas cotas serão publicadas.',
            'total_quantity.min' => 'Publique ao menos 1 cota.',
            'starts_on.after_or_equal' => 'O período deve começar hoje ou depois.',
            'ends_on.after_or_equal' => 'O fim do período deve ser igual ou posterior ao início.',
            'hours.required' => 'Escolha ao menos um horário.',
            'hours.min' => 'Escolha ao menos um horário.',
            'hours.*.regex' => 'Horário inválido.',
            'allocations.*.user_id.exists' => 'Cliente inválido.',
            'allocations.*.user_id.distinct' => 'Cliente repetido na lista.',
        ];
    }
}
