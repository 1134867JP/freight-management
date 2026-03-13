import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import PageHeader from '@/Components/UI/PageHeader';
import { Head, Link, useForm } from '@inertiajs/react';

export default function CompanyInstance({ company, instance }) {
  const { data, setData, patch, post, processing, errors } = useForm({
    instance_label: instance?.label ?? '',
    instance_name: instance?.instance_name ?? '',
    instance_base_url: instance?.base_url ?? '',
    instance_api_key: '',
    instance_is_active: instance?.is_active ?? true,
    clear_instance_api_key: false,
  });

  const submit = (event) => {
    event.preventDefault();

    patch(route('platform.companies.instance.update', company.id), {
      preserveScroll: true,
    });
  };

  const syncInstance = () => {
    post(route('platform.companies.instance.sync', company.id), {
      preserveScroll: true,
    });
  };

  const refreshInstance = () => {
    post(route('platform.companies.instance.refresh', company.id), {
      preserveScroll: true,
    });
  };

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title={`Instância da empresa ${company.name}`}
          subtitle="Tela dedicada para salvar configuração, gerar QR code e acompanhar o estado real da conexão."
          actions={
            <Link
              href={route('platform.dashboard')}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Voltar para empresas
            </Link>
          }
        />
      }
    >
      <Head title={`Instância | ${company.name}`} />

      <div className="py-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div className="space-y-6">
            <FlashMessages />

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-950 p-6 text-white">
                <h2 className="text-lg font-semibold">Configuração da instância</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Salve a configuração primeiro. Depois use os botões de sincronização para criar ou reconectar a instância na Evolution.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-6 p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Nome de exibição" error={errors.instance_label}>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-xl border-slate-300"
                      value={data.instance_label}
                      onChange={(event) => setData('instance_label', event.target.value)}
                      placeholder="WhatsApp Operacional"
                      required
                    />
                  </Field>

                  <Field label="Nome técnico da instância" error={errors.instance_name}>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-xl border-slate-300"
                      value={data.instance_name}
                      onChange={(event) => setData('instance_name', event.target.value)}
                      placeholder="empresa-a"
                      required
                    />
                  </Field>

                  <Field label="Base URL da Evolution" error={errors.instance_base_url}>
                    <input
                      type="url"
                      className="mt-1 block w-full rounded-xl border-slate-300"
                      value={data.instance_base_url}
                      onChange={(event) => setData('instance_base_url', event.target.value)}
                      placeholder="http://localhost:8088"
                      required
                    />
                  </Field>

                  <Field
                    label="API Key"
                    hint={instance?.has_api_key ? 'Deixe em branco para manter a chave atual.' : null}
                    error={errors.instance_api_key}
                  >
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-xl border-slate-300"
                      value={data.instance_api_key}
                      onChange={(event) => setData('instance_api_key', event.target.value)}
                      placeholder={instance?.has_api_key ? '********' : 'apikey'}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-2xl border border-dashed border-slate-200 p-4 md:grid-cols-2">
                  <label className="flex items-center gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(data.instance_is_active)}
                      onChange={(event) => setData('instance_is_active', event.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                    />
                    Instância ativa para envio
                  </label>

                  <label className="flex items-center gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(data.clear_instance_api_key)}
                      onChange={(event) => setData('clear_instance_api_key', event.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                    />
                    Limpar API Key atual
                  </label>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={syncInstance}
                      disabled={processing || !instance}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      Gerar QR Code / Conectar
                    </button>
                    <button
                      type="button"
                      onClick={refreshInstance}
                      disabled={processing || !instance}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      Atualizar estado
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={processing}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    Salvar configuração
                  </button>
                </div>
              </form>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Empresa</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-slate-700">{company.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{company.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">Slug: {company.slug}</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</p>
              <div className="mt-4 space-y-3">
                <StatusRow label="Estado atual" value={formatState(instance?.connection_state)} />
                <StatusRow label="Instância salva" value={instance ? 'Sim' : 'Não'} />
                <StatusRow label="API Key" value={instance?.has_api_key ? 'Configurada' : 'Pendente'} />
                <StatusRow label="Ativa" value={instance?.is_active ? 'Sim' : 'Não'} />
                <StatusRow
                  label="Última sincronização"
                  value={instance?.last_synced_at ? new Date(instance.last_synced_at).toLocaleString('pt-BR') : 'Nunca'}
                />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">QR Code</p>
              <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4">
                {instance?.qr_code ? (
                  <div className="mx-auto flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <img
                      src={instance.qr_code}
                      alt="QR Code da instância"
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-slate-500">
                    <p>Nenhum QR Code disponível.</p>
                    <p>Salve a configuração e clique em <strong>Gerar QR Code / Conectar</strong>.</p>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

function Field({ label, hint = null, error = null, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  );
}

function StatusRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

function formatState(value) {
  const map = {
    open: 'Conectada',
    closed: 'Desconectada',
    connecting: 'Conectando',
    not_configured: 'Não configurada',
    unknown: 'Desconhecido',
  };

  return map[value] || value || 'Desconhecido';
}
