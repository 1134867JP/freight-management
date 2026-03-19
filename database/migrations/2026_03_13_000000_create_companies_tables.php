<?php

use App\Models\Company;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('companies')) {
            Schema::create('companies', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('company_settings')) {
            Schema::create('company_settings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('company_id')->constrained()->cascadeOnDelete();
                $table->string('logo_path')->nullable();
                $table->json('settings')->nullable();
                $table->timestamps();

                $table->unique('company_id');
            });
        }

        if (! Schema::hasTable('whatsapp_instances')) {
            Schema::create('whatsapp_instances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('company_id')->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->string('instance_name');
                $table->string('base_url')->nullable();
                $table->string('api_key')->nullable();
                $table->boolean('is_default')->default(false);
                $table->boolean('is_active')->default(true);
                $table->json('settings')->nullable();
                $table->timestamps();

                $table->unique(['company_id', 'instance_name']);
                $table->index(['company_id', 'is_default']);
            });
        }

        if (! DB::table('companies')->where('slug', Company::DEFAULT_SLUG)->exists()) {
            $idCompany = DB::table('companies')->insertGetId([
                'name' => Company::DEFAULT_NAME,
                'slug' => Company::DEFAULT_SLUG,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('company_settings')->insert([
                'company_id' => $idCompany,
                'logo_path' => null,
                'settings' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_instances');
        Schema::dropIfExists('company_settings');
        Schema::dropIfExists('companies');
    }
};
