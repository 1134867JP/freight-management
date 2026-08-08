import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import FormField from '@/Components/UI/FormField';
import FormActions from '@/Components/UI/FormActions';
import StatusBadge from '@/Components/UI/StatusBadge';
import TableShell from '@/Components/UI/TableShell';
import Button from '@/Components/UI/Button';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { Head, useForm, router } from '@inertiajs/react';
import { formatDateTime } from '@/utils/formatters';
import { getStatusPresentation } from '@/utils/statusPresentation';

function LocationLabel({ tipo, id, spots, docas }) {
  if (!tipo) return <span className="italic text-gray-400">Portaria</span>;
  if (tipo === 'spot') {
    const sp = spots?.find(s => s.id === id);
    return <span className="font-mono">{sp ? `${sp.zone?.codigo || '?'}-${sp.nome}` : `Vaga #${id}`}</span>;
  }
  if (tipo === 'doca') {
    const d = docas?.find(d => d.id === id);
    return <span className="font-mono">{d ? `${d.codigo}` : `Doca #${id}`}</span>;
  }
  return <span>{id}</span>;
}

export default function MoveOrders({ orders, activeFreights, availableSpots, docas, yardTrucks }) {
  const confirm = useConfirm();
  const [showCreate, setCreate] = useState(false);

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    freight_id: '', destino_tipo: 'spot', destino_id: '', yard_truck_id: '', operador_id: '', notas: '',
  });

  const resetForm = () => { setCreate(false); clearErrors(); reset(); };

  const handleSubmit = e => {
    e.preventDefault();
    post(route('admin.move-orders.store'), { onSuccess: resetForm, preserveScroll: true });
  };

  const doAction = async (url, confirmMsg) => {
    if (confirmMsg && !(await confirm(confirmMsg))) return;
    router.patch(url, {}, { preserveScroll: true });
  };

  const allOrders = orders?.data || [];
  const activeOrders = allOrders.filter(o => ['pending', 'in_progress'].includes(o.status));
  const doneOrders   = allOrders.filter(o => ['completed', 'cancelled'].includes(o.status));

  const destOptions = data.destino_tipo === 'spot' ? availableSpots : docas?.filter(d => d.status !== 'occupied');

  return (
    <AuthenticatedLayout header={
      <PageHeader
        title="Ordens de Movimentação"
        subtitle="Gerencie o reposicionamento de veículos no pátio"
        actions={
          <Button onClick={() => setCreate(true)}>
            + Nova Ordem
          </Button>
        }
      />
    }>
      <Head title="Ordens de Movimentação" />
      <div className="py-8">
        <div className="mx-auto max-w-6xl sm:px-6 lg:px-8">
          <FlashMessages />

          {/* Active orders */}
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Ativas ({activeOrders.length})
          </h2>
          {activeOrders.length === 0 ? (
            <div className="mb-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-600 dark:bg-gray-800">
              <p className="text-sm text-gray-400">Nenhuma ordem ativa no momento.</p>
            </div>
          ) : (
            <div className="mb-8 space-y-2">
              {activeOrders.map(order => (
                <div key={order.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge {...getStatusPresentation('moveOrder', order.status)} />
                      <span className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">
                        {order.freight?.truck_plate}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        <LocationLabel tipo={order.origem_tipo} id={order.origem_id} spots={availableSpots} docas={docas} />
                        {' → '}
                        <LocationLabel tipo={order.destino_tipo} id={order.destino_id} spots={availableSpots} docas={docas} />
                      </span>
                      {order.yard_truck && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          🚛 {order.yard_truck.identificador}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <Button size="sm" onClick={() => doAction(route('admin.move-orders.start', order.id))}>
                          Iniciar
                        </Button>
                      )}
                      {order.status === 'in_progress' && (
                        <Button size="sm" onClick={() => doAction(route('admin.move-orders.complete', order.id))}>
                          Concluir
                        </Button>
                      )}
                      <Button size="sm" variant="danger" onClick={() => doAction(route('admin.move-orders.cancel', order.id), 'Cancelar esta ordem?')}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                  {order.notas && <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{order.notas}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Done orders */}
          {doneOrders.length > 0 && (
            <>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Concluídas / Canceladas
              </h2>
              <TableShell>
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {['Veículo', 'Origem', 'Destino', 'Status', 'Cavalo', 'Concluída em'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {doneOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-2.5 font-mono text-xs font-bold text-gray-800 dark:text-gray-200">{order.freight?.truck_plate}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500"><LocationLabel tipo={order.origem_tipo} id={order.origem_id} spots={availableSpots} docas={docas} /></td>
                        <td className="px-4 py-2.5 text-xs text-gray-500"><LocationLabel tipo={order.destino_tipo} id={order.destino_id} spots={availableSpots} docas={docas} /></td>
                        <td className="px-4 py-2.5"><StatusBadge {...getStatusPresentation('moveOrder', order.status)} /></td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{order.yard_truck?.identificador || '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">
                          {formatDateTime(order.concluido_em)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            </>
          )}
        </div>
      </div>

      <ModalShell show={showCreate} title="Nova Ordem de Movimentação" onClose={resetForm}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Veículo (frete)" error={errors.freight_id} required>
            <select className={`mt-1 block w-full ${FormField.inputClass(errors.freight_id)}`} value={data.freight_id} onChange={e => setData('freight_id', e.target.value)} required>
              <option value="">Selecione o frete...</option>
              {(activeFreights || []).map(f => (
                <option key={f.id} value={f.id}>{f.truck_plate} — {f.driver_name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Tipo de destino" error={errors.destino_tipo} required>
            <div className="mt-1 flex gap-3">
              {[['spot', 'Vaga no pátio'], ['doca', 'Doca']].map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={v} checked={data.destino_tipo === v} onChange={() => { setData('destino_tipo', v); setData('destino_id', ''); }} className="text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{l}</span>
                </label>
              ))}
            </div>
          </FormField>

          <FormField label="Destino" error={errors.destino_id} required>
            <select className={`mt-1 block w-full ${FormField.inputClass(errors.destino_id)}`} value={data.destino_id} onChange={e => setData('destino_id', e.target.value)} required>
              <option value="">Selecione o destino...</option>
              {(destOptions || []).map(opt => (
                <option key={opt.id} value={opt.id}>
                  {data.destino_tipo === 'spot'
                    ? `${opt.zone?.nome ? opt.zone.nome + ' / ' : ''}${opt.nome}`
                    : `${opt.codigo} — ${opt.nome}`
                  }
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Cavalo mecânico" error={errors.yard_truck_id}>
            <select className={`mt-1 block w-full ${FormField.inputClass(errors.yard_truck_id)}`} value={data.yard_truck_id} onChange={e => setData('yard_truck_id', e.target.value)}>
              <option value="">— Nenhum —</option>
              {(yardTrucks || []).map(t => (
                <option key={t.id} value={t.id} disabled={t.status === 'busy'}>{t.identificador}{t.status === 'busy' ? ' (ocupado)' : ''}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Notas" error={errors.notas}>
            <textarea className={`mt-1 block w-full ${FormField.inputClass(errors.notas)}`} value={data.notas} onChange={e => setData('notas', e.target.value)} rows="2" placeholder="Instruções para o operador..." />
          </FormField>

          <FormActions>
            <Button variant="secondary" className="flex-1" onClick={resetForm}>Cancelar</Button>
            <Button type="submit" loading={processing} className="flex-1">
              Criar Ordem
            </Button>
          </FormActions>
        </form>
      </ModalShell>
    </AuthenticatedLayout>
  );
}
