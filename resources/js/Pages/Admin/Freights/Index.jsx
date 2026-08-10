import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import Button from '@/Components/UI/Button';
import Card from '@/Components/UI/Card';
import FormField from '@/Components/UI/FormField';
import PageHeader from '@/Components/UI/PageHeader';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { Head, router, usePage } from '@inertiajs/react';
import AssignDocaModal from './Partials/AssignDocaModal';
import FinalizeFreightModal from './Partials/FinalizeFreightModal';
import FreightsTable from './Partials/FreightsTable';
import UploadAttachmentModal from './Partials/UploadAttachmentModal';

export default function Index({ freights, docasDisponiveis }) {
  const { auth } = usePage().props;
  const usesDocks = auth.company?.uses_docks ?? true;
  const list = useMemo(() => freights?.data || [], [freights]);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterOp, setFilterOp] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [finalizeModal, setFinalizeModal] = useState({ open: false, freight: null });
  const [grossWeight, setGrossWeight] = useState('');
  const [netWeight, setNetWeight] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [attachmentModal, setAttachmentModal] = useState({ open: false, freight: null });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [assignDocaModal, setAssignDocaModal] = useState({ open: false, freight: null });

  const normalizeStatus = (status) => {
    if (status === 'arrived') return 'arrived';
    if (status === 'loading') return 'loading';
    if (status === 'unloading') return 'unloading';
    if (status === 'completed') return 'completed';
    if (status === 'cancelled') return 'cancelled';
    return 'reserved';
  };

  const getDateKey = (value) => {
    if (!value) return '';
    const vlDate = new Date(value);
    const nrYear = vlDate.getFullYear();
    const nrMonth = String(vlDate.getMonth() + 1).padStart(2, '0');
    const nrDay = String(vlDate.getDate()).padStart(2, '0');
    return `${nrYear}-${nrMonth}-${nrDay}`;
  };

  const statusSummary = useMemo(
    () =>
      list.reduce(
        (arrAccumulator, objFreight) => {
          const strStatus = normalizeStatus(objFreight.status);
          arrAccumulator[strStatus] = (arrAccumulator[strStatus] || 0) + 1;
          return arrAccumulator;
        },
        {
          reserved: 0,
          arrived: 0,
          loading: 0,
          unloading: 0,
          completed: 0,
          cancelled: 0,
        },
      ),
    [list],
  );

  const filteredFreights = useMemo(() => {
    const strSearch = filterSearch.trim().toLowerCase();

    return list.filter((objFreight) => {
      if (strSearch) {
        const strClientName = (objFreight.user?.name || '').toLowerCase();
        const strPlate = (objFreight.truck_plate || '').toLowerCase();
        const blMatchesSearch = strClientName.includes(strSearch) || strPlate.includes(strSearch);

        if (!blMatchesSearch) return false;
      }

      if (filterOp !== 'all' && objFreight.operation_type !== filterOp) {
        return false;
      }

      if (filterStatus !== 'all' && normalizeStatus(objFreight.status) !== filterStatus) {
        return false;
      }

      if (filterDate) {
        const strFreightDate = getDateKey(objFreight.timeslot?.start_time);
        if (strFreightDate !== filterDate) return false;
      }

      return true;
    });
  }, [list, filterSearch, filterOp, filterStatus, filterDate]);

  const confirm = useConfirm();

  const cancelReservation = async (id) => {
    const ok = await confirm('Cancelar esta reserva?');
    if (!ok) return;

    router.patch(
      route('freights.reject', id),
      { notes: 'Cancelado pelo admin.' },
      { preserveScroll: true },
    );
  };

  const startOperation = (objFreight) => {
    if (objFreight.operation_type === 'load') {
      router.patch(
        route('freights.start-load', objFreight.id),
        {},
        { preserveScroll: true },
      );
      return;
    }

    if (objFreight.operation_type === 'unload') {
      router.patch(route('freights.start-unload', objFreight.id), {}, { preserveScroll: true });
    }
  };

  const submitFinalize = (event) => {
    event.preventDefault();

    if (!finalizeModal.freight) return;

    router.patch(
      route('freights.finalize-operation', finalizeModal.freight.id),
      {
        gross_weight: grossWeight,
        net_weight: netWeight,
        admin_notes: adminNotes,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setFinalizeModal({ open: false, freight: null });
          setGrossWeight('');
          setNetWeight('');
          setAdminNotes('');
        },
      },
    );
  };

  const resetFilters = () => {
    setFilterSearch('');
    setFilterOp('all');
    setFilterStatus('all');
    setFilterDate('');
  };

  const exportCsvUrl = () => {
    const params = new URLSearchParams();
    if (filterOp !== 'all') params.set('operation_type', filterOp);
    if (filterStatus !== 'all') params.set('status', filterStatus);
    if (filterDate) params.set('date_from', filterDate);
    if (filterDate) params.set('date_to', filterDate);
    const qs = params.toString();
    return route('admin.freights.export') + (qs ? '?' + qs : '');
  };

  const openAttachmentModal = (objFreight) => {
    setAttachmentModal({ open: true, freight: objFreight });
    setAttachmentFile(null);
  };

  const closeAttachmentModal = () => {
    setAttachmentModal({ open: false, freight: null });
    setAttachmentFile(null);
  };

  const submitAttachment = (event) => {
    event.preventDefault();

    if (!attachmentModal.freight || !attachmentFile) return;
    setUploadingAttachment(true);

    router.post(
      route('freights.add-attachment', attachmentModal.freight.id),
      { attachment: attachmentFile },
      {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: closeAttachmentModal,
        onFinish: () => setUploadingAttachment(false),
      },
    );
  };

  return (
    <AuthenticatedLayout
      header={<PageHeader title="Fretes" subtitle="Operações e gestão de reservas de frete" />}
    >
      <Head title="Fretes" />

      <div className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FlashMessages />

          <Card className="rounded-lg p-4 sm:p-6">
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6" aria-label="Resumo dos fretes">
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-700">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">Reservados</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{statusSummary.reserved}</p>
              </div>
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-900/20">
                <p className="text-xs font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-400">No Pátio</p>
                <p className="mt-2 text-2xl font-bold text-sky-800 dark:text-sky-300">{statusSummary.arrived}</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">Carregando</p>
                <p className="mt-2 text-2xl font-bold text-amber-800 dark:text-amber-300">{statusSummary.loading}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-400">Descarregando</p>
                <p className="mt-2 text-2xl font-bold text-blue-800 dark:text-blue-300">{statusSummary.unloading}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <p className="text-xs font-semibold uppercase tracking-widest text-green-700 dark:text-green-400">Finalizados</p>
                <p className="mt-2 text-2xl font-bold text-green-800 dark:text-green-300">{statusSummary.completed}</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-xs font-semibold uppercase tracking-widest text-red-700 dark:text-red-400">Cancelados</p>
                <p className="mt-2 text-2xl font-bold text-red-800 dark:text-red-300">{statusSummary.cancelled}</p>
              </div>
            </div>

            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">Filtros</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{filteredFreights.length} resultado(s)</p>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                <FormField id="freight-search" label="Buscar" className="space-y-1">
                  <FormField.Input
                    id="freight-search"
                    type="search"
                    value={filterSearch}
                    onChange={(event) => setFilterSearch(event.target.value)}
                    placeholder="Cliente ou placa"
                    className="mt-0"
                    aria-label="Buscar por cliente ou placa"
                  />
                </FormField>

                <FormField id="freight-operation" label="Operação" className="space-y-1">
                  <FormField.Select
                    id="freight-operation"
                    className="mt-0"
                    value={filterOp}
                    onChange={(event) => setFilterOp(event.target.value)}
                  >
                    <option value="all">Todas</option>
                    <option value="load">Carga</option>
                    <option value="unload">Descarga</option>
                  </FormField.Select>
                </FormField>

                <FormField id="freight-status" label="Status" className="space-y-1">
                  <FormField.Select
                    id="freight-status"
                    className="mt-0"
                    value={filterStatus}
                    onChange={(event) => setFilterStatus(event.target.value)}
                  >
                    <option value="all">Todos</option>
                    <option value="reserved">Reservado</option>
                    <option value="arrived">No Pátio</option>
                    <option value="loading">Carregando</option>
                    <option value="unloading">Descarregando</option>
                    <option value="completed">Finalizado</option>
                    <option value="cancelled">Cancelado</option>
                  </FormField.Select>
                </FormField>

                <FormField id="freight-date" label="Data" className="space-y-1">
                  <FormField.Input
                    id="freight-date"
                    type="date"
                    value={filterDate}
                    onChange={(event) => setFilterDate(event.target.value)}
                    className="mt-0"
                  />
                </FormField>

                <div className="flex items-end gap-2">
                  <Button
                    onClick={resetFilters}
                    variant="secondary"
                    className="flex-1"
                  >
                    Limpar
                  </Button>
                  <a
                    href={exportCsvUrl()}
                    className="flex items-center gap-1.5 rounded-md border border-green-500 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path d="M12 3v13m0 0-4-4m4 4 4-4M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    </svg>
                    CSV
                  </a>
                </div>
              </div>
            </div>

            <FreightsTable
              freights={filteredFreights}
              onCancelReservation={cancelReservation}
              onStartOperation={startOperation}
              onOpenFinalizeModal={(objFreight) =>
                setFinalizeModal({ open: true, freight: objFreight })
              }
              onOpenAttachmentModal={openAttachmentModal}
              onOpenAssignDocaModal={usesDocks ? (objFreight) =>
                setAssignDocaModal({ open: true, freight: objFreight }) : undefined
              }
            />
          </Card>
        </div>
      </div>

      <FinalizeFreightModal
        open={finalizeModal.open}
        freight={finalizeModal.freight}
        grossWeight={grossWeight}
        netWeight={netWeight}
        adminNotes={adminNotes}
        onChangeGrossWeight={setGrossWeight}
        onChangeNetWeight={setNetWeight}
        onChangeAdminNotes={setAdminNotes}
        onSubmit={submitFinalize}
        onClose={() => setFinalizeModal({ open: false, freight: null })}
      />

      <UploadAttachmentModal
        open={attachmentModal.open}
        freight={attachmentModal.freight}
        file={attachmentFile}
        processing={uploadingAttachment}
        onChangeFile={setAttachmentFile}
        onSubmit={submitAttachment}
        onClose={closeAttachmentModal}
      />

      {usesDocks && (
        <AssignDocaModal
          open={assignDocaModal.open}
          freight={assignDocaModal.freight}
          docasDisponiveis={docasDisponiveis}
          onClose={() => setAssignDocaModal({ open: false, freight: null })}
        />
      )}
    </AuthenticatedLayout>
  );
}
