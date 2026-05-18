<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('companies')
            ->whereNotNull('logo_path')
            ->where(function ($query) {
                $query->where('logo_path', '0')
                      ->orWhere('logo_path', '')
                      ->orWhereRaw("logo_path NOT LIKE '%/%'");
            })
            ->update(['logo_path' => null]);
    }

    public function down(): void {}
};
