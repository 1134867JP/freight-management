<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('companies', 'logo_path')) {
            Schema::table('companies', function (Blueprint $table) {
                $table->string('logo_path')->nullable()->after('is_active');
                $table->json('settings')->nullable()->after('logo_path');
            });
        }

        if (Schema::hasTable('company_settings')) {
            DB::table('company_settings')->get()->each(function ($setting) {
                DB::table('companies')
                    ->where('id', $setting->company_id)
                    ->update([
                        'logo_path' => $setting->logo_path,
                        'settings' => $setting->settings,
                    ]);
            });

            Schema::dropIfExists('company_settings');
        }
    }

    public function down(): void
    {
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('logo_path')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->unique('company_id');
        });

        DB::table('companies')->get()->each(function ($company) {
            DB::table('company_settings')->insert([
                'company_id' => $company->id,
                'logo_path' => $company->logo_path,
                'settings' => $company->settings,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['logo_path', 'settings']);
        });
    }
};
