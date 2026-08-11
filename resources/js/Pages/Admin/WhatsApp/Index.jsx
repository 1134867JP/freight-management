import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import PageHeader from '@/Components/UI/PageHeader';
import Button from '@/Components/UI/Button';
import StatusBadge from '@/Components/UI/StatusBadge';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import { formatDateTime } from '@/utils/formatters';
import { Head, router, usePage } from '@inertiajs/react';

export default function Index({ configured, instance, bot, commands = [] }) {
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
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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
                        Última sincronização: {formatDateTime(instance.last_synced_at)}
                      </p>
                    )}
                  </div>
                  <ConnectionBadge connected={instance?.connected} />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {canSync && <Button onClick={handleSync}>Gerar QR Code</Button>}
                  {instance && (
                    <Button onClick={handleRefresh} variant="secondary">
                      Atualizar estado
                    </Button>
                  )}
                  {instance && instance.connection_state !== 'open' && (
                    <Button onClick={handleDelete} variant="danger">
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

              <BotAccessCard bot={bot} instance={instance} />

              <CommandHistory commands={commands} />
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

function BotAccessCard({ bot, instance }) {
  const webhookReady = Boolean(instance?.bot_webhook_matches_config);
  const ready = Boolean(bot?.enabled && bot?.configured && webhookReady);
  const status = ready
    ? { label: 'Ativo', tone: 'success' }
    : bot?.enabled
      ? { label: 'Aguardando configuração', tone: 'warning' }
      : { label: 'Desativado', tone: 'neutral' };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-gray-400">
            Criação de cotas pelo WhatsApp
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-gray-100">
            Comandos com confirmação
          </h2>
        </div>
        <StatusBadge label={status.label} tone={status.tone} />
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-gray-300">
        Administradores e funcionários autorizados, com WhatsApp cadastrado, podem solicitar
        cotas. O sistema identifica quantidade, cliente, data e horário, mas só salva depois da resposta{' '}
        <strong>CONFIRMAR</strong>.
      </p>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-gray-600 dark:bg-gray-900/40">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">
          Exemplo recomendado
        </p>
        <code className="mt-2 block break-words text-sm font-semibold text-slate-800 dark:text-gray-100">
          10 cotas | Cliente X | amanhã | 10:00
        </code>
        <p className="mt-2 text-xs text-slate-500 dark:text-gray-400">
          A janela terá {bot?.timeslot_duration_minutes ?? 60} minutos e a confirmação expira em{' '}
          {bot?.confirmation_ttl_minutes ?? 10} minutos.
        </p>
      </div>

      {bot?.enabled && !bot?.configured && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          Defina o segredo e a URL do webhook no ambiente para ativar o recebimento de comandos.
        </p>
      )}

      {bot?.enabled && bot?.configured && !webhookReady && (
        <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          {instance
            ? 'Clique em “Atualizar estado” para registrar o webhook desta instância na Evolution.'
            : 'Gere o QR Code para criar a instância e registrar o webhook na Evolution.'}
        </p>
      )}

      {webhookReady && (
        <p className="mt-3 text-xs text-slate-500 dark:text-gray-400">
          Webhook registrado em {formatDateTime(instance.bot_webhook_configured_at)}.
        </p>
      )}
    </section>
  );
}

function CommandHistory({ commands }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-slate-200 px-6 py-5 dark:border-gray-700">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-gray-400">
          Auditoria do bot
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-gray-100">
          Comandos recentes
        </h2>
      </div>

      {commands.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-slate-500 dark:text-gray-400">
          Nenhum comando recebido ainda.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-gray-700">
            <thead className="bg-slate-50 dark:bg-gray-700/50">
              <tr>
                {['Protocolo', 'Solicitante', 'Pedido', 'Cliente / horário', 'Status'].map(
                  (label) => (
                    <th
                      key={label}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400"
                    >
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
              {commands.map((command) => {
                const presentation = commandStatus(command.status);
                return (
                  <tr key={command.id} className="align-top">
                    <td className="whitespace-nowrap px-5 py-4">
                      <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                        {command.protocol}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                        {formatDateTime(command.created_at)}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700 dark:text-gray-300">
                      {command.sender_name || 'Não identificado'}
                    </td>
                    <td className="max-w-xs px-5 py-4">
                      <p className="line-clamp-2 text-sm text-slate-700 dark:text-gray-300">
                        {command.message}
                      </p>
                      {command.error_message && (
                        <p className="mt-1 line-clamp-2 text-xs text-red-600 dark:text-red-400">
                          {command.error_message}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700 dark:text-gray-300">
                      <p>{command.client_name || '—'}</p>
                      {command.start_time && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                          {formatDateTime(command.start_time)} · {command.capacity} cotas
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <StatusBadge label={presentation.label} tone={presentation.tone} />
                      {command.timeslot_id && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                          Cota #{command.timeslot_id}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function commandStatus(status) {
  const map = {
    received: { label: 'Recebido', tone: 'info' },
    pending_confirmation: { label: 'Aguardando confirmação', tone: 'warning' },
    executed: { label: 'Criado', tone: 'success' },
    cancelled: { label: 'Cancelado', tone: 'neutral' },
    expired: { label: 'Expirado', tone: 'neutral' },
    rejected: { label: 'Rejeitado', tone: 'danger' },
    failed: { label: 'Falhou', tone: 'danger' },
  };

  return map[status] || { label: status || 'Desconhecido', tone: 'neutral' };
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
            <Button onClick={onDelete} variant="danger">
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
            <Button onClick={onRetry} variant="danger">
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
  return (
    <StatusBadge
      label={connected ? 'Conectado' : 'Desconectado'}
      tone={connected ? 'success' : 'danger'}
    />
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
