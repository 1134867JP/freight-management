<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Freight;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FreightExportController extends Controller
{
    public function __invoke(Request $request): StreamedResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $query = Freight::with(['user', 'timeslot'])
            ->where('freights.company_id', $user->company_id)
            ->orderBy('freights.created_at', 'desc');

        if ($request->filled('operation_type') && $request->input('operation_type') !== 'all') {
            $query->where('operation_type', $request->input('operation_type'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('freights.status', $request->input('status'));
        }

        if ($request->filled('date_from')) {
            $query->whereHas('timeslot', fn ($q) =>
                $q->whereDate('start_time', '>=', $request->input('date_from'))
            );
        }

        if ($request->filled('date_to')) {
            $query->whereHas('timeslot', fn ($q) =>
                $q->whereDate('start_time', '<=', $request->input('date_to'))
            );
        }

        $filename = 'fretes-' . now()->format('Y-m-d') . '.csv';

        // lazy() busca 1000 registros por vez — sem acumular tudo em memória.
        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');

            // BOM para compatibilidade com Excel
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, [
                'ID',
                'Placa',
                'Motorista',
                'Operação',
                'Status',
                'Horário Início',
                'Horário Fim',
                'Endereço de Descarga',
                'Peso Bruto (kg)',
                'Peso Líquido (kg)',
                'Observações',
                'Cliente',
                'Data Criação',
            ], ';');

            foreach ($query->lazy() as $freight) {
                fputcsv($handle, [
                    $freight->id,
                    $freight->truck_plate,
                    $freight->driver_name,
                    $freight->operation_type === 'load' ? 'Carga' : 'Descarga',
                    $freight->status->value,
                    $freight->timeslot?->start_time?->format('d/m/Y H:i') ?? '',
                    $freight->timeslot?->end_time?->format('d/m/Y H:i') ?? '',
                    $freight->timeslot?->dropoffAddress?->address ?? '',
                    $freight->gross_weight !== null ? number_format((float) $freight->gross_weight, 2, ',', '.') : '',
                    $freight->net_weight !== null ? number_format((float) $freight->net_weight, 2, ',', '.') : '',
                    $freight->admin_notes ?? '',
                    $freight->user?->name ?? '',
                    $freight->created_at->format('d/m/Y H:i'),
                ], ';');
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
