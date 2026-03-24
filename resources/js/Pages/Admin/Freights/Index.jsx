import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import PageHeader from '@/Components/UI/PageHeader';
import { confirmAction } from '@/Components/UI/confirmAction';
import { Head, router } from '@inertiajs/react';
import FinalizeFreightModal from './Partials/FinalizeFreightModal';
import FreightsTable from './Partials/FreightsTable';
import UploadAttachmentModal from './Partials/UploadAttachmentModal';

export default function Index({ freights }) {
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

  const normalizeStatus = (status) => {
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
          arrAccumulator[strStatus] += 1;
          return arrAccumulator;
        },
        {
          reserved: 0,
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

  const cancelReservation = (id) => {
    if (!confirmAction('Cancelar esta reserva?')) return;

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

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <FlashMessages />

          <div className="rounded-lg bg-white p-4 shadow sm:p-8 dark:bg-gray-800">
            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/40">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Reservados</p>
                <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-gray-200">{statusSummary.reserved}</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-400">Carregando</p>
                <p className="mt-1 text-2xl font-semibold text-amber-800 dark:text-amber-300">{statusSummary.loading}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-400">Descarregando</p>
                <p className="mt-1 text-2xl font-semibold text-blue-800 dark:text-blue-300">{statusSummary.unloading}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                <p className="text-xs uppercase tracking-wide text-green-700 dark:text-green-400">Finalizados</p>
                <p className="mt-1 text-2xl font-semibold text-green-800 dark:text-green-300">{statusSummary.completed}</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-xs uppercase tracking-wide text-red-700 dark:text-red-400">Cancelados</p>
                <p className="mt-1 text-2xl font-semibold text-red-800 dark:text-red-300">{statusSummary.cancelled}</p>
              </div>
            </div>

            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(event) => setFilterSearch(event.target.value)}
                  placeholder="Buscar cliente ou placa"
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                />

                <select
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  value={filterOp}
                  onChange={(event) => setFilterOp(event.target.value)}
                >
                  <option value="all">Operação: Todas</option>
                  <option value="load">Operação: Carga</option>
                  <option value="unload">Operação: Descarga</option>
                </select>

                <select
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  value={filterStatus}
                  onChange={(event) => setFilterStatus(event.target.value)}
                >
                  <option value="all">Status: Todos</option>
                  <option value="reserved">Status: Reservado</option>
                  <option value="loading">Status: Carregando</option>
                  <option value="unloading">Status: Descarregando</option>
                  <option value="completed">Status: Finalizado</option>
                  <option value="cancelled">Status: Cancelado</option>
                </select>

                <input
                  type="date"
                  value={filterDate}
                  onChange={(event) => setFilterDate(event.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />

                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Limpar filtros
                </button>
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
            />
          </div>
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
    </AuthenticatedLayout>
  );
}
