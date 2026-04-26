<?php

namespace App\Http\Controllers;

use App\Models\Freight;
use App\Models\Timeslot;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function adminTimeslots(Request $request)
    {
        $query = Timeslot::with(['dropoffAddress', 'creator'])
            ->where('company_id', $request->user()->company_id)
            ->orderByDesc('start_time');

        if ($request->filled('date_from')) {
            $query->whereDate('start_time', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('start_time', '<=', $request->date_to);
        }

        if ($request->filled('operation_type')) {
            $query->where('operation_type', $request->operation_type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $timeslots = $query->withCount([
            'freights as active_reservations' => fn($q) => $q->whereNotIn('status', ['cancelled']),
        ])->paginate(50)->withQueryString();

        return Inertia::render('Admin/Reports/Timeslots', [
            'timeslots' => $timeslots,
            'filters' => $request->only(['date_from', 'date_to', 'operation_type', 'status']),
        ]);
    }

    public function adminFreights(Request $request)
    {
        $query = Freight::with(['user', 'timeslot'])
            ->where('company_id', $request->user()->company_id)
            ->orderByDesc('created_at');

        if ($request->filled('date_from')) {
            $query->whereHas('timeslot', fn($q) => $q->whereDate('start_time', '>=', $request->date_from));
        }

        if ($request->filled('date_to')) {
            $query->whereHas('timeslot', fn($q) => $q->whereDate('start_time', '<=', $request->date_to));
        }

        if ($request->filled('operation_type')) {
            $query->where('operation_type', $request->operation_type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('driver_name', 'like', $search)
                    ->orWhere('truck_plate', 'like', $search)
                    ->orWhereHas('user', fn($u) => $u->where('name', 'like', $search));
            });
        }

        $freights = $query->paginate(50)->withQueryString();

        return Inertia::render('Admin/Reports/Freights', [
            'freights' => $freights,
            'filters' => $request->only(['date_from', 'date_to', 'operation_type', 'status', 'search']),
        ]);
    }

    public function exportFreightsXls(Request $request)
    {
        $query = Freight::with(['user:id,name,email', 'timeslot:id,start_time'])
            ->where('company_id', $request->user()->company_id)
            ->orderByDesc('created_at');

        if ($request->filled('date_from')) {
            $query->whereHas('timeslot', fn ($q) => $q->whereDate('start_time', '>=', $request->date_from));
        }
        if ($request->filled('date_to')) {
            $query->whereHas('timeslot', fn ($q) => $q->whereDate('start_time', '<=', $request->date_to));
        }
        if ($request->filled('operation_type')) {
            $query->where('operation_type', $request->operation_type);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('driver_name', 'like', $search)
                    ->orWhere('truck_plate', 'like', $search)
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', $search));
            });
        }

        $opLabels     = ['load' => 'Carga', 'unload' => 'Descarga'];
        $statusLabels = [
            'reserved' => 'Reservado', 'loading' => 'Carregando',
            'unloading' => 'Descarregando', 'completed' => 'Concluído', 'cancelled' => 'Cancelado',
        ];
        $headers  = ['Horário', 'Cliente', 'Email', 'Motorista', 'Placa', 'Operação', 'Carga', 'Peso Bruto (kg)', 'Peso Líquido (kg)', 'Status'];
        $filename = 'fretes_' . now()->format('Y-m-d') . '.xls';

        return response()->streamDownload(function () use ($query, $headers, $opLabels, $statusLabels) {
            echo $this->xlsStreamHeader('Fretes', $headers);

            foreach ($query->lazy() as $fr) {
                $cols = [
                    $fr->timeslot ? $fr->timeslot->start_time->format('d/m/Y H:i') : '',
                    e($fr->user?->name ?? ''),
                    e($fr->user?->email ?? ''),
                    e($fr->driver_name ?? ''),
                    strtoupper($fr->truck_plate ?? ''),
                    $opLabels[$fr->operation_type] ?? $fr->operation_type,
                    e($fr->cargo_description ?? ''),
                    $fr->gross_weight !== null ? number_format($fr->gross_weight, 2, ',', '.') : '',
                    $fr->net_weight !== null ? number_format($fr->net_weight, 2, ',', '.') : '',
                    $statusLabels[$fr->status->value ?? $fr->status] ?? ($fr->status->value ?? $fr->status),
                ];
                echo '<tr>' . implode('', array_map(fn ($c) => "<td style=\"border:1px solid #ccc;padding:5px 10px\">{$c}</td>", $cols)) . '</tr>';
            }

            echo '</tbody></table></body></html>';
        }, $filename, [
            'Content-Type'        => 'application/vnd.ms-excel; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function exportTimeslotsXls(Request $request)
    {
        $query = Timeslot::with(['dropoffAddress:id,name', 'creator:id,name'])
            ->withCount(['freights as active_reservations' => fn ($q) => $q->occupying()])
            ->where('company_id', $request->user()->company_id)
            ->orderByDesc('start_time');

        if ($request->filled('date_from')) {
            $query->whereDate('start_time', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('start_time', '<=', $request->date_to);
        }
        if ($request->filled('operation_type')) {
            $query->where('operation_type', $request->operation_type);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $opLabels     = ['load' => 'Carga', 'unload' => 'Descarga'];
        $statusLabels = ['available' => 'Disponível', 'full' => 'Lotado', 'closed' => 'Encerrado'];
        $headers      = ['Início', 'Fim', 'Operação', 'Capacidade', 'Reservas', 'Status', 'Endereço', 'Criado por'];
        $filename     = 'cotas_' . now()->format('Y-m-d') . '.xls';

        return response()->streamDownload(function () use ($query, $headers, $opLabels, $statusLabels) {
            echo $this->xlsStreamHeader('Cotas', $headers);

            foreach ($query->lazy() as $ts) {
                $cols = [
                    $ts->start_time->format('d/m/Y H:i'),
                    $ts->end_time->format('d/m/Y H:i'),
                    $opLabels[$ts->operation_type] ?? $ts->operation_type,
                    $ts->capacity,
                    $ts->active_reservations,
                    $statusLabels[$ts->status] ?? $ts->status,
                    e($ts->dropoffAddress?->name ?? ''),
                    e($ts->creator?->name ?? ''),
                ];
                echo '<tr>' . implode('', array_map(fn ($c) => "<td style=\"border:1px solid #ccc;padding:5px 10px\">{$c}</td>", $cols)) . '</tr>';
            }

            echo '</tbody></table></body></html>';
        }, $filename, [
            'Content-Type'        => 'application/vnd.ms-excel; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Emite o cabeçalho do documento XLS (HTML-in-Excel).
     * O corpo das linhas é emitido incrementalmente pelo caller; fechar com </tbody></table></body></html>.
     */
    private function xlsStreamHeader(string $title, array $headers): string
    {
        $th = implode('', array_map(
            fn ($h) => "<th style=\"background:#f0f0f0;font-weight:bold;border:1px solid #ccc;padding:6px 10px\">{$h}</th>",
            $headers
        ));

        return <<<HTML
        <html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:x="urn:schemas-microsoft-com:office:excel"
              xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8">
        <style>table{border-collapse:collapse}th,td{white-space:nowrap}</style>
        </head>
        <body>
        <h3>{$title}</h3>
        <table>
          <thead><tr>{$th}</tr></thead>
          <tbody>
        HTML;
    }

    public function clientReservations(Request $request)
    {
        $query = Freight::with(['timeslot'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at');

        if ($request->filled('date_from')) {
            $query->whereHas('timeslot', fn($q) => $q->whereDate('start_time', '>=', $request->date_from));
        }

        if ($request->filled('date_to')) {
            $query->whereHas('timeslot', fn($q) => $q->whereDate('start_time', '<=', $request->date_to));
        }

        if ($request->filled('operation_type')) {
            $query->where('operation_type', $request->operation_type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $freights = $query->paginate(50)->withQueryString();

        return Inertia::render('Client/Reports/Reservations', [
            'freights' => $freights,
            'filters' => $request->only(['date_from', 'date_to', 'operation_type', 'status']),
        ]);
    }
}
