import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import PageHeader from '@/Components/UI/PageHeader';
import { Head, router } from '@inertiajs/react';

export default function Index({ configured, instance }) {
  const handleSync = () => {
    router.post(route('admin.whatsapp.sync'), {}, { preserveScroll: true });
  };

  const handleRefresh = () => {
    router.post(route('admin.whatsapp.refresh'), {}, { preserveScroll: true });
  };

  const handleDelete = () => {
    if (!instance) return;
    if (!window.confirm('Deseja excluir a instância do WhatsApp?')) return;
    router.delete(route('admin.whatsapp.destroy'), { preserveScroll: true });
  };

  const canDelete = Boolean(instance && !instance.connected);
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
          <FlashMessages />

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
                        {new Date(instance.last_synced_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <ConnectionBadge connected={instance?.connected} />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {canSync && (
                    <button
                      type="button"
                      onClick={handleSync}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      Gerar QR Code
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Atualizar estado
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                    >
                      Excluir instância
                    </button>
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

function ConnectionBadge({ connected }) {
  if (connected) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
        Conectado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
      Desconectado
    </span>
  );
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
