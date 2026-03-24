import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import PageHeader from '@/Components/UI/PageHeader';
import StatusBadge from '@/Components/UI/StatusBadge';
import { confirmAction } from '@/Components/UI/confirmAction';
import {
  getFreightStatusTone,
  translateFreightStatus,
} from '@/Features/Freight/utils/freightPresentation';
import { Head, Link, router } from '@inertiajs/react';

export default function MyReservations({ freights }) {
  const uploadNotaFiscal = (freightId, file) => {
    if (!file) return;

    router.post(
      route('client.upload-invoice', freightId),
      { nota_fiscal: file },
      { forceFormData: true, preserveScroll: true },
    );
  };

  const canUploadNotaFiscal = (freight) =>
    freight.operation_type === 'unload' &&
    !freight.attachments?.some((a) => a.type === 'invoice') &&
    freight.status !== 'cancelled' &&
    freight.status !== 'completed';

  const canCancel = (freight) => freight.status !== 'cancelled' && freight.status !== 'completed';
  const canReopen = (freight) => freight.status === 'cancelled';
  const hasActions = (freight) =>
    canUploadNotaFiscal(freight) || canCancel(freight) || canReopen(freight);

  return (
    <AuthenticatedLayout
      header={<PageHeader title="Minhas Reservas" subtitle="Acompanhe e gerencie seus fretes" />}
    >
      <Head title="Minhas Reservas" />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <FlashMessages />

          <div className="overflow-x-auto rounded-lg bg-white p-4 shadow sm:p-8 dark:bg-gray-800">
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
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="border-b py-2 dark:border-gray-700 dark:text-gray-300">Horário</th>
                    <th className="border-b py-2 dark:border-gray-700 dark:text-gray-300">Caminhão / Placa</th>
                    <th className="border-b py-2 dark:border-gray-700 dark:text-gray-300">Operação</th>
                    <th className="border-b py-2 dark:border-gray-700 dark:text-gray-300">Pesos</th>
                    <th className="border-b py-2 dark:border-gray-700 dark:text-gray-300">Anexos</th>
                    <th className="border-b py-2 dark:border-gray-700 dark:text-gray-300">Status</th>
                    <th className="border-b py-2 dark:border-gray-700 dark:text-gray-300">Observações</th>
                    <th className="border-b py-2 dark:border-gray-700 dark:text-gray-300">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {freights.map((freight) => (
                    <tr key={freight.id} className="align-top hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:text-gray-300">
                      <td className="py-2">
                        {freight.timeslot
                          ? new Date(freight.timeslot.start_time).toLocaleString('pt-BR')
                          : 'Horário Excluído'}
                      </td>
                      <td className="py-2">
                        {freight.driver_name} - {freight.truck_plate}
                      </td>
                      <td className="py-2">
                        {freight.operation_type === 'load' ? 'Carga' : 'Descarga'}
                      </td>
                      <td className="py-2 text-sm">
                        <div>Bruto: {freight.gross_weight ?? '-'}</div>
                        <div>Líquido: {freight.net_weight ?? '-'}</div>
                      </td>
                      <td className="space-y-1 py-2 text-sm">
                        {(() => {
                          const invoiceAtt = freight.attachments?.find((a) => a.type === 'invoice');
                          const adminAtt = freight.attachments?.find((a) => a.type === 'attachment');
                          return (
                            <>
                              <div>
                                {invoiceAtt ? (
                                  <a
                                    href={`/storage/${invoiceAtt.path}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 underline"
                                  >
                                    Nota Fiscal
                                  </a>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500">Sem NF</span>
                                )}
                              </div>
                              <div>
                                {adminAtt ? (
                                  <a
                                    href={`/storage/${adminAtt.path}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 underline"
                                  >
                                    Anexo Admin
                                  </a>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500">Sem anexo</span>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </td>
                      <td className="py-2">
                        <StatusBadge
                          label={translateFreightStatus(freight.status)}
                          tone={getFreightStatusTone(freight.status)}
                        />
                      </td>
                      <td className="py-2 text-sm text-gray-600 dark:text-gray-400">{freight.admin_notes || '-'}</td>

                      <td className="space-y-2 py-2">
                        {canUploadNotaFiscal(freight) && (
                          <div>
                            <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Enviar NF</label>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="text-xs"
                              onChange={(event) =>
                                uploadNotaFiscal(freight.id, event.target.files?.[0])
                              }
                            />
                          </div>
                        )}

                        {canCancel(freight) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirmAction('Tem certeza que deseja cancelar esta reserva?')) {
                                router.delete(route('client.reservations.cancel', freight.id), {
                                  preserveScroll: true,
                                });
                              }
                            }}
                            className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                          >
                            Cancelar
                          </button>
                        )}

                        {canReopen(freight) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirmAction('Deseja reabrir esta reserva cancelada?')) {
                                router.patch(
                                  route('client.reservations.reopen', freight.id),
                                  {},
                                  { preserveScroll: true },
                                );
                              }
                            }}
                            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                          >
                            Reabrir
                          </button>
                        )}

                        {!hasActions(freight) && (
                          <span className="text-xs italic text-gray-500 dark:text-gray-400">
                            Sem ações disponíveis
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
