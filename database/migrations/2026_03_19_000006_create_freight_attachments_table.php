<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('freight_attachments')) {
            Schema::create('freight_attachments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('freight_id')->constrained()->cascadeOnDelete();
                $table->foreignId('company_id')->constrained()->cascadeOnDelete();
                $table->string('type', 30); // 'invoice', 'attachment'
                $table->string('path');
                $table->string('original_name')->nullable();
                $table->unsignedBigInteger('size_bytes')->nullable();
                $table->string('mime_type', 100)->nullable();
                $table->timestamps();

                $table->index(['freight_id', 'type']);
                $table->index(['company_id', 'type']);
            });
        }

        // Migrate existing invoice_path data
        if (Schema::hasColumn('freights', 'invoice_path')) {
            DB::table('freights')
                ->whereNotNull('invoice_path')
                ->get()
                ->each(function ($freight) {
                    DB::table('freight_attachments')->insert([
                        'freight_id' => $freight->id,
                        'company_id' => $freight->company_id,
                        'type' => 'invoice',
                        'path' => $freight->invoice_path,
                        'original_name' => null,
                        'size_bytes' => null,
                        'mime_type' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                });

            Schema::table('freights', function (Blueprint $table) {
                $table->dropColumn('invoice_path');
            });
        }

        // Migrate existing attachment_path data
        if (Schema::hasColumn('freights', 'attachment_path')) {
            DB::table('freights')
                ->whereNotNull('attachment_path')
                ->get()
                ->each(function ($freight) {
                    DB::table('freight_attachments')->insert([
                        'freight_id' => $freight->id,
                        'company_id' => $freight->company_id,
                        'type' => 'attachment',
                        'path' => $freight->attachment_path,
                        'original_name' => null,
                        'size_bytes' => null,
                        'mime_type' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                });

            Schema::table('freights', function (Blueprint $table) {
                $table->dropColumn('attachment_path');
            });
        }
    }

    public function down(): void
    {
        // Restore columns
        if (! Schema::hasColumn('freights', 'invoice_path')) {
            Schema::table('freights', function (Blueprint $table) {
                $table->string('invoice_path')->nullable()->after('net_weight');
            });
        }

        if (! Schema::hasColumn('freights', 'attachment_path')) {
            Schema::table('freights', function (Blueprint $table) {
                $table->string('attachment_path')->nullable()->after('invoice_path');
            });
        }

        // Restore data from freight_attachments
        DB::table('freight_attachments')->where('type', 'invoice')->get()->each(function ($att) {
            DB::table('freights')->where('id', $att->freight_id)->update(['invoice_path' => $att->path]);
        });

        DB::table('freight_attachments')->where('type', 'attachment')->get()->each(function ($att) {
            DB::table('freights')->where('id', $att->freight_id)->update(['attachment_path' => $att->path]);
        });

        Schema::dropIfExists('freight_attachments');
    }
};
