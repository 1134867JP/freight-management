<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class ReadinessController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            DB::select('SELECT 1');

            $writableDirectories = [
                storage_path('framework/cache'),
                storage_path('framework/sessions'),
                storage_path('framework/views'),
                storage_path('logs'),
                base_path('bootstrap/cache'),
            ];

            $ready = Schema::hasTable('migrations')
                && Schema::hasTable('jobs')
                && collect($writableDirectories)->every(
                    fn (string $path): bool => is_dir($path) && is_writable($path),
                );
        } catch (Throwable) {
            $ready = false;
        }

        return response()->json(
            ['status' => $ready ? 'ready' : 'not_ready'],
            $ready ? 200 : 503,
        );
    }
}
