import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import PageHeader from '@/Components/UI/PageHeader';
import Button from '@/Components/UI/Button';
import StatusBadge from '@/Components/UI/StatusBadge';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { formatDateTime } from '@/utils/formatters';
import { Head, router, usePage } from '@inertiajs/react';

export default function Index({ configured, instance }) {
  const confirm = useConfirm();
  const { flash = {} } = usePage().props;

  const handleSync = () => {
    router.post(route('admin.whatsapp.sync'), {}, { preserveScroll: true });
  };

  const handleRefresh = () => {
    router.post(route('admin.whatsapp.refresh'), {}, { preserveScroll: true });
  };

  const handleDelete = async () => {
    if (!instance) return;
    if (!(await confirm('Deseja excluir a instância do WhatsApp?'))) return;
    router.delete(route('admin.whatsapp.destroy'), { preserveScroll: true });
  };

  const canSync = !instance?.connected;

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="WhatsApp"
          subtitle="Conecte o WhatsApp da sua empresa escaneando o QR Code."
        />
      }
    >
      <Head title="WhatsApp" />

      <div className="py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <FlashMessages flash={{ success: flash.success, info: flash.info }} />

          {flash.error && (
            <ErrorRecovery
              message={flash.error}
              action={flash.error_action}
              instance={instance}
              onRetry={handleSync}
              onDelete={handleDelete}
            />
          )}

          {!configured ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Evolution API não configurado no servidor. Entre em contato com o administrador da
                plataforma.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                      Estado da conexão
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-gray-100">
                      {formatState(instance?.connection_state)}
                    </p>
                    {instance?.last_synced_at && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                        Última sincronização:{' '}
                        {formatDateTime(instance.last_synced_at)}
                      </p>
                    )}
                  </div>
                  <ConnectionBadge connected={instance?.connected} />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {canSync && (
                    <Button
                      onClick={handleSync}
                    >
                      Gerar QR Code
                    </Button>
                  )}
                  <Button
                    onClick={handleRefresh}
                    variant="secondary"
                  >
                    Atualizar estado
                  </Button>
                  {instance && instance.connection_state !== 'open' && (
                    <Button
                      onClick={handleDelete}
                      variant="danger"
                    >
                      Excluir instância
                    </Button>
                  )}
                </div>
              </section>

              {instance?.qr_code && (
                <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-gray-400">
                    QR Code
                  </p>
                  <div className="flex justify-center">
                    <div className="w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-gray-600">
                      <img
                        src={instance.qr_code}
                        alt="QR Code WhatsApp"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                  <p className="mt-4 text-center text-sm text-slate-500 dark:text-gray-400">
                    Abra o WhatsApp no celular e escaneie o código acima.
                  </p>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

function ErrorRecovery({ message, action, instance, onRetry, onDelete }) {
  const canDelete = Boolean(instance && instance.connection_state !== 'open');
  const deleteIsFirst = action === 'delete_instance' && canDelete;

  return (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/20">
      <p className="text-sm font-medium text-red-800 dark:text-red-300">{message}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {deleteIsFirst ? (
          <>
            <Button
              onClick={onDelete}
              variant="danger"
            >
              Excluir instância
            </Button>
            <Button
              onClick={onRetry}
              variant="secondary"
              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
            >
              Tentar novamente
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={onRetry}
              variant="danger"
            >
              Tentar novamente
            </Button>
            {canDelete && (
              <Button
                onClick={onDelete}
                variant="secondary"
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
              >
                Excluir instância
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ConnectionBadge({ connected }) {
  return <StatusBadge label={connected ? 'Conectado' : 'Desconectado'} tone={connected ? 'success' : 'danger'} />;
}

function formatState(value) {
  const map = {
    open: 'Conectado',
    closed: 'Desconectado',
    connecting: 'Conectando',
    not_configured: 'Não configurado',
    unknown: 'Aguardando',
  };
  return map[value] || value || 'Aguardando';
}
