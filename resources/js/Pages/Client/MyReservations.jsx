import React, { useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import StatusBadge from '@/Components/UI/StatusBadge';
import QrCodeDisplay from '@/Components/UI/QrCodeDisplay';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import {
  getFreightStatusTone,
  translateFreightStatus,
  translateOperationType,
} from '@/Features/Freight/utils/freightPresentation';
import { Head, Link, router } from '@inertiajs/react';

const baseChip =
  'inline-flex items-center rounded px-2 py-1 text-xs font-medium';

function AttachmentsCell({ freight, onUploadNF }) {
  const fileRef = useRef(null);
  const invoiceAtt = freight.attachments?.find((a) => a.type === 'invoice');
  const adminAtt = freight.attachments?.find((a) => a.type === 'attachment');
  const showUpload =
    freight.operation_type === 'unload' &&
    !invoiceAtt &&
    freight.status !== 'cancelled' &&
    freight.status !== 'completed';

  return (
    <td className="w-[18%] px-4 py-3 align-middle">
      <div className="flex flex-wrap gap-1.5">
        {invoiceAtt ? (
          <a
            href={invoiceAtt.client_url}
            target="_blank"
            rel="noreferrer"
            title="Ver nota fiscal"
            className={`${baseChip} bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50`}
          >
            NF ↗
          </a>
        ) : (
          <span className={`${baseChip} bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500`}>
            NF
          </span>
        )}

        {adminAtt ? (
          <a
            href={adminAtt.admin_url}
            target="_blank"
            rel="noreferrer"
            title="Ver anexo"
            className={`${baseChip} bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50`}
          >
            Anexo ↗
          </a>
        ) : (
          <span className={`${baseChip} bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500`}>
            Anexo
          </span>
        )}

        {showUpload && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => onUploadNF(freight.id, e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="Enviar nota fiscal"
              className={`${baseChip} bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40`}
            >
              + NF
            </button>
          </>
        )}
      </div>
    </td>
  );
}

export default function MyReservations({ freights, filters = {} }) {
  const [form, setForm] = useState({
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    operation_type: filters.operation_type || '',
    status: filters.status || '',
  });

  const applyFilters = (e) => {
    e.preventDefault();
    router.get(route('client.reservations'), form, { preserveScroll: true });
  };

  const clearFilters = () => {
    const empty = { date_from: '', date_to: '', operation_type: '', status: '' };
    setForm(empty);
    router.get(route('client.reservations'), {}, { preserveScroll: true });
  };

  const uploadNotaFiscal = (freightId, file) => {
    if (!file) return;
    router.post(
      route('client.upload-invoice', freightId),
      { nota_fiscal: file },
      { forceFormData: true, preserveScroll: true },
    );
  };

  const confirm = useConfirm();
  const [qrFreight, setQrFreight] = useState(null);

  const canCancel = (freight) => freight.status !== 'cancelled' && freight.status !== 'completed';
  const canReopen = (freight) => freight.status === 'cancelled';
  const hasActions = (freight) => canCancel(freight) || canReopen(freight);

  const btnBase =
    'inline-flex items-center justify-center rounded-md border px-2.5 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 whitespace-nowrap';

  return (
    <AuthenticatedLayout
      header={<PageHeader title="Minhas Reservas" subtitle="Acompanhe e gerencie seus fretes" />}
    >
      <Head title="Minhas Reservas" />

      <div className="py-8">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
          <FlashMessages />

          {/* Filtros */}
          <form
            onSubmit={applyFilters}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">De</label>
                <input
                  type="date"
                  value={form.date_from}
                  onChange={(e) => setForm({ ...form, date_from: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Até</label>
                <input
                  type="date"
                  value={form.date_to}
                  onChange={(e) => setForm({ ...form, date_to: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Operação</label>
                <select
                  value={form.operation_type}
                  onChange={(e) => setForm({ ...form, operation_type: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Todas</option>
                  <option value="load">Carga</option>
                  <option value="unload">Descarga</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="">Todos</option>
                  <option value="reserved">Reservado</option>
                  <option value="loading">Carregando</option>
                  <option value="unloading">Descarregando</option>
                  <option value="completed">Finalizado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Filtrar
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-md border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Limpar
              </button>
            </div>
          </form>

          {freights.length === 0 ? (
            <EmptyState
              title="Você não possui nenhuma reserva."
              action={
                <Link href={route('client.available')} className="text-blue-600 underline">
                  Solicitar um horário
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full table-fixed text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Horário</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Caminhão / Placa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Operação</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Pesos</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Anexos</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Observações</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {freights.map((freight) => (
                    <tr key={freight.id} className="align-top transition hover:bg-gray-50/70">
                      <td className="px-4 py-4 align-top text-sm">
                        {freight.timeslot
                          ? <>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {new Date(freight.timeslot.start_time).toLocaleDateString('pt-BR')}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(freight.timeslot.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </>
                          : <span className="text-xs text-gray-400 dark:text-gray-500">Horário excluído</span>}
                      </td>

                      <td className="px-4 py-4 align-top text-sm">
                        <p className="text-sm font-semibold tracking-wide text-gray-900 dark:text-gray-100">{freight.truck_plate}</p>
                        {freight.driver_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{freight.driver_name}</p>
                        )}
                        <StatusBadge
                          label={translateOperationType(freight.operation_type)}
                          tone="neutral"
                          className="mt-1 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
                        />
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-gray-600">
                        <p>B: <span className="font-medium text-gray-800 dark:text-gray-200">{freight.gross_weight ? `${freight.gross_weight} kg` : '—'}</span></p>
                        <p>L: <span className="font-medium text-gray-800 dark:text-gray-200">{freight.net_weight ? `${freight.net_weight} kg` : '—'}</span></p>
                      </td>

                      <AttachmentsCell freight={freight} onUploadNF={uploadNotaFiscal} />

                      <td className="px-4 py-4 align-top text-sm">
                        <StatusBadge
                          label={translateFreightStatus(freight.status)}
                          tone={getFreightStatusTone(freight.status)}
                          className="px-2 py-1 text-xs font-bold uppercase tracking-wide"
                        />
                      </td>

                      <td className="px-4 py-4 align-top text-sm text-gray-600">
                        {freight.admin_notes || <span className="text-gray-400 dark:text-gray-500">—</span>}
                      </td>

                      <td className="px-4 py-4 align-top text-sm">
                        <div className="flex flex-wrap gap-2">
                          {canCancel(freight) && (
                            <button
                              type="button"
                              onClick={async () => {
                                const ok = await confirm('Tem certeza que deseja cancelar esta reserva?');
                                if (ok) {
                                  router.delete(route('client.reservations.cancel', freight.id), {
                                    preserveScroll: true,
                                  });
                                }
                              }}
                              className={`${btnBase} border-red-600 bg-white text-red-600 hover:bg-red-50 focus:ring-red-500 dark:bg-transparent dark:hover:bg-red-950/40`}
                            >
                              Cancelar
                            </button>
                          )}

                          {canReopen(freight) && (
                            <button
                              type="button"
                              onClick={async () => {
                                const ok = await confirm('Deseja reabrir esta reserva cancelada?');
                                if (ok) {
                                  router.patch(
                                    route('client.reservations.reopen', freight.id),
                                    {},
                                    { preserveScroll: true },
                                  );
                                }
                              }}
                              className={`${btnBase} border-teal-700 bg-teal-700 text-white hover:bg-teal-800 focus:ring-teal-500`}
                            >
                              Reabrir
                            </button>
                          )}

                          {freight.qr_token && (
                            <button
                              type="button"
                              onClick={() => setQrFreight(freight)}
                              className={`${btnBase} border-teal-600 bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500`}
                            >
                              QR
                            </button>
                          )}

                          {!hasActions(freight) && !freight.qr_token && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">Sem ações</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ModalShell
        show={Boolean(qrFreight)}
        title="QR Code de Entrada"
        onClose={() => setQrFreight(null)}
      >
        {qrFreight && (
          <div className="flex flex-col items-center gap-4 py-2">
            <QrCodeDisplay
              value={qrFreight.qr_token}
              size={200}
              label="Mostre este código na portaria para check-in rápido"
            />
            <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-center text-sm font-bold text-gray-800 dark:text-gray-200">
                {qrFreight.truck_plate}
              </p>
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">{qrFreight.driver_name}</p>
              {qrFreight.timeslot && (
                <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">
                  {new Date(qrFreight.timeslot.start_time).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              )}
            </div>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              O porteiro escaneia este QR para fazer o check-in automaticamente.
            </p>
          </div>
        )}
      </ModalShell>
    </AuthenticatedLayout>
  );
}
