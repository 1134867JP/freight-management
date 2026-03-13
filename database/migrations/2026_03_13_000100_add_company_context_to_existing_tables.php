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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('company_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->cascadeOnDelete();
            $table->string('new_role')->default('client')->after('role');
            $table->index(['company_id', 'role']);
        });

        Schema::table('dropoff_addresses', function (Blueprint $table) {
            $table->foreignId('company_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->cascadeOnDelete();
            $table->index(['company_id', 'is_active']);
        });

        Schema::table('timeslots', function (Blueprint $table) {
            $table->foreignId('company_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->cascadeOnDelete();
            $table->index(['company_id', 'status', 'start_time']);
        });

        Schema::table('freights', function (Blueprint $table) {
            $table->foreignId('company_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->cascadeOnDelete();
            $table->index(['company_id', 'status']);
        });

        Schema::table('trucks', function (Blueprint $table) {
            $table->foreignId('company_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->cascadeOnDelete();
            $table->index(['company_id', 'is_active']);
        });

        Schema::table('client_timeslot', function (Blueprint $table) {
            $table->foreignId('company_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->cascadeOnDelete();
            $table->index(['company_id', 'timeslot_id']);
            $table->index(['company_id', 'user_id']);
        });

        $idDefaultCompany = DB::table('companies')
            ->where('slug', Company::DEFAULT_SLUG)
            ->value('id');

        if (! $idDefaultCompany) {
            $idDefaultCompany = DB::table('companies')->insertGetId([
                'name' => Company::DEFAULT_NAME,
                'slug' => Company::DEFAULT_SLUG,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('company_settings')->insert([
                'company_id' => $idDefaultCompany,
                'logo_path' => null,
                'settings' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('users')
            ->whereNull('company_id')
            ->update(['company_id' => $idDefaultCompany]);

        DB::statement("
            UPDATE users
            SET new_role = CASE
                WHEN role = 'admin' THEN 'company_admin'
                WHEN role = 'client' THEN 'client'
                ELSE role
            END
        ");

        DB::table('dropoff_addresses')
            ->whereNull('company_id')
            ->update(['company_id' => $idDefaultCompany]);

        DB::update(
            '
                UPDATE timeslots
                SET company_id = COALESCE(
                    (SELECT company_id FROM users WHERE users.id = timeslots.created_by),
                    (SELECT company_id FROM dropoff_addresses WHERE dropoff_addresses.id = timeslots.dropoff_address_id),
                    ?
                )
                WHERE company_id IS NULL
            ',
            [$idDefaultCompany],
        );

        DB::update(
            '
                UPDATE trucks
                SET company_id = COALESCE(
                    (SELECT company_id FROM users WHERE users.id = trucks.user_id),
                    ?
                )
                WHERE company_id IS NULL
            ',
            [$idDefaultCompany],
        );

        DB::update(
            '
                UPDATE freights
                SET company_id = COALESCE(
                    (SELECT company_id FROM users WHERE users.id = freights.user_id),
                    (SELECT company_id FROM timeslots WHERE timeslots.id = freights.timeslot_id),
                    ?
                )
                WHERE company_id IS NULL
            ',
            [$idDefaultCompany],
        );

        DB::update(
            '
                UPDATE client_timeslot
                SET company_id = COALESCE(
                    (SELECT company_id FROM timeslots WHERE timeslots.id = client_timeslot.timeslot_id),
                    (SELECT company_id FROM users WHERE users.id = client_timeslot.user_id),
                    ?
                )
                WHERE company_id IS NULL
            ',
            [$idDefaultCompany],
        );

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_company_id_role_index');
            $table->dropColumn('role');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('new_role', 'role');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index(['company_id', 'role']);
        });

        Schema::table('dropoff_addresses', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable(false)->change();
        });

        Schema::table('timeslots', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable(false)->change();
        });

        Schema::table('freights', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable(false)->change();
        });

        Schema::table('trucks', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable(false)->change();
        });

        Schema::table('client_timeslot', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('client_timeslot', function (Blueprint $table) {
            $table->dropConstrainedForeignId('company_id');
        });

        Schema::table('trucks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('company_id');
        });

        Schema::table('freights', function (Blueprint $table) {
            $table->dropConstrainedForeignId('company_id');
        });

        Schema::table('timeslots', function (Blueprint $table) {
            $table->dropConstrainedForeignId('company_id');
        });

        Schema::table('dropoff_addresses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('company_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_company_id_role_index');
            $table->string('legacy_role')->default('client')->after('role');
        });

        DB::statement("
            UPDATE users
            SET legacy_role = CASE
                WHEN role = 'company_admin' THEN 'admin'
                WHEN role = 'platform_admin' THEN 'admin'
                ELSE 'client'
            END
        ");

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('legacy_role', 'role');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('company_id');
        });
    }
};
