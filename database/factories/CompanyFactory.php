<?php

namespace Database\Factories;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Company>
 */
class CompanyFactory extends Factory
{
    protected $model = Company::class;

    public function definition(): array
    {
        $strName = fake()->unique()->company();

        return [
            'name' => $strName,
            'slug' => Str::slug($strName).'-'.fake()->unique()->numberBetween(1000, 9999),
            'is_active' => true,
        ];
    }
}
