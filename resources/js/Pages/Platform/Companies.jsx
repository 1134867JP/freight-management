import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import { confirmAction } from '@/Components/UI/confirmAction';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

function initialFormData() {
  return {
    company_name: '',
    company_slug: '',
    company_is_active: true,
    logo: null,
    remove_logo: false,
    admin_name: '',
    admin_email: '',
    admin_password: '',
    admin_whatsapp_phone: '',
  };
}

export default function Companies({ companies, summary }) {
  const [editingCompany, setEditingCompany] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentLogoUrl, setCurrentLogoUrl] = useState(null);
  const [selectedLogoUrl, setSelectedLogoUrl] = useState(null);

  const { data, setData, post, processing, errors, clearErrors, transform } = useForm(initialFormData());

  const cards = useMemo(
    () => [
      { label: 'Empresas', value: summary?.companies_count ?? 0, tone: 'text-gray-900' },
      { label: 'Empresas ativas', value: summary?.active_companies_count ?? 0, tone: 'text-emerald-700' },
      { label: 'Instâncias prontas', value: summary?.instances_ready_count ?? 0, tone: 'text-blue-700' },
      { label: 'Clientes totais', value: summary?.clients_count ?? 0, tone: 'text-amber-700' },
    ],
    [summary],
  );

  const applyFormData = (payload) => {
    Object.entries(payload).forEach(([key, value]) => {
      setData(key, value);
    });
  };

  const resetForm = () => {
    applyFormData(initialFormData());
    clearErrors();
    setEditingCompany(null);
    setCurrentLogoUrl(null);
    setSelectedLogoUrl(null);
    setShowModal(false);
  };

  useEffect(() => {
    if (!(data.logo instanceof File)) {
      setSelectedLogoUrl(null);

      return undefined;
    }

    const objectUrl = URL.createObjectURL(data.logo);
    setSelectedLogoUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [data.logo]);

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (company) => {
    setEditingCompany(company);
    setCurrentLogoUrl(company.logo_url);
    setShowModal(true);
    applyFormData({
      company_name: company.name ?? '',
      company_slug: company.slug ?? '',
      company_is_active: Boolean(company.is_active),
      logo: null,
      remove_logo: false,
      admin_name: company.admin?.name ?? '',
      admin_email: company.admin?.email ?? '',
      admin_password: '',
      admin_whatsapp_phone: company.admin?.whatsapp_phone ?? '',
    });
  };

  const submit = (event) => {
    event.preventDefault();

    if (editingCompany) {
      transform((formData) => ({
        ...formData,
        _method: 'patch',
      }));

      post(route('platform.companies.update', editingCompany.id), {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: () => {
          transform((formData) => formData);
          resetForm();
        },
      });

      return;
    }

    transform((formData) => formData);
    post(route('platform.companies.store'), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => resetForm(),
    });
  };

  const deleteCompany = (company) => {
    if (!company.can_delete) {
      return;
    }

    if (!confirmAction(`Tem certeza que deseja excluir a empresa ${company.name}? Esta ação removerá os dados vinculados.`)) {
      return;
    }

    router.delete(route('platform.companies.destroy', company.id), {
      preserveScroll: true,
    });
  };

  const logoPreviewUrl = data.remove_logo ? null : selectedLogoUrl ?? currentLogoUrl;

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Painel Global"
          subtitle="Cadastre empresas, mantenha o admin principal e abra uma tela dedicada para QR code e conexão da instância."
          actions={
            <button
              type="button"
              onClick={openCreate}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              + Nova Empresa
            </button>
          }
        />
      }
    >
      <Head title="Painel Global" />

      <div className="py-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <FlashMessages />

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className={`mt-2 text-3xl font-bold ${card.tone}`}>{card.value}</p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {companies.map((company) => (
              <article key={company.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-5 border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold">{company.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold">{company.name}</h3>
                        <StatusPill active={company.is_active}>{company.is_active ? 'Ativa' : 'Inativa'}</StatusPill>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">Slug: {company.slug}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(company)}
                        className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                      >
                        Editar empresa
                      </button>
                      <Link
                        href={route('platform.companies.instance.edit', company.id)}
                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                      >
                        Instância / QR Code
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteCompany(company)}
                        disabled={!company.can_delete}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          company.can_delete
                            ? 'bg-red-500 text-white hover:bg-red-400'
                            : 'cursor-not-allowed bg-white/10 text-white/50'
                        }`}
                      >
                        Excluir empresa
                      </button>
                    </div>

                    {!company.can_delete && (
                      <p className="text-xs text-amber-200">
                        {formatActiveTimeslotMessage(company.stats.active_timeslots_count)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <SectionTitle>Admin principal</SectionTitle>
                    {company.admin ? (
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="font-medium text-slate-900">{company.admin.name}</p>
                        <p className="mt-1 text-sm text-slate-600">{company.admin.email}</p>
                        <p className="mt-1 text-sm text-slate-500">WhatsApp: {company.admin.whatsapp_phone || 'Não informado'}</p>
                      </div>
                    ) : (
                      <EmptyBlock text="Nenhum admin cadastrado." />
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <MiniStat label="Admins" value={company.stats.company_admins_count} />
                      <MiniStat label="Clientes" value={company.stats.clients_count} />
                      <MiniStat label="Horários" value={company.stats.timeslots_count} />
                      <MiniStat label="Fretes" value={company.stats.freights_count} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <SectionTitle>Instância WhatsApp</SectionTitle>
                    {company.whatsapp_instance ? (
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">{company.whatsapp_instance.label}</p>
                            <p className="mt-1 text-sm text-slate-500">{company.whatsapp_instance.instance_name}</p>
                          </div>
                          <StatusPill active={company.whatsapp_instance.is_active}>
                            {company.whatsapp_instance.is_active ? 'Ativa' : 'Desligada'}
                          </StatusPill>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">
                          Base URL: {company.whatsapp_instance.base_url || 'Não configurada'}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          API Key: {company.whatsapp_instance.has_api_key ? 'Configurada' : 'Pendente'}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Estado: {formatState(company.whatsapp_instance.connection_state)}
                        </p>
                      </div>
                    ) : (
                      <EmptyBlock text="Instância ainda não configurada. Abra a tela dedicada para salvar a configuração e gerar o QR code." />
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>

      <ModalShell
        show={showModal}
        onClose={resetForm}
        title={editingCompany ? `Editar ${editingCompany.name}` : 'Nova Empresa'}
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={submit} className="space-y-8">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <SectionTitle>Empresa</SectionTitle>
            </div>

            <Field label="Nome da empresa" error={errors.company_name}>
              <input
                type="text"
                className="mt-1 block w-full rounded-xl border-slate-300"
                value={data.company_name}
                onChange={(event) => setData('company_name', event.target.value)}
                required
              />
            </Field>

            <Field label="Slug" hint="Se vazio, será gerado a partir do nome." error={errors.company_slug}>
              <input
                type="text"
                className="mt-1 block w-full rounded-xl border-slate-300"
                value={data.company_slug}
                onChange={(event) => setData('company_slug', event.target.value)}
                placeholder="minha-empresa"
              />
            </Field>

            <Field label="Logo" hint="PNG ou JPG até 2MB." error={errors.logo}>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="mt-1 block w-full text-sm text-slate-600"
                onChange={(event) => {
                  const file = event.target.files[0] ?? null;
                  setData('logo', file);

                  if (file) {
                    setData('remove_logo', false);
                  }
                }}
              />
            </Field>

            <div className="space-y-3 rounded-2xl border border-dashed border-slate-200 p-4">
              <p className="text-sm font-medium text-slate-700">Status e branding</p>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(data.company_is_active)}
                  onChange={(event) => setData('company_is_active', event.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                Empresa ativa
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(data.remove_logo)}
                  onChange={(event) => setData('remove_logo', event.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                Remover logo atual
              </label>
              {logoPreviewUrl && (
                <img src={logoPreviewUrl} alt="Preview da logo" className="h-20 rounded-xl object-contain" />
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <SectionTitle>Admin principal</SectionTitle>
            </div>

            <Field label="Nome" error={errors.admin_name}>
              <input
                type="text"
                className="mt-1 block w-full rounded-xl border-slate-300"
                value={data.admin_name}
                onChange={(event) => setData('admin_name', event.target.value)}
                required
              />
            </Field>

            <Field label="Email" error={errors.admin_email}>
              <input
                type="email"
                className="mt-1 block w-full rounded-xl border-slate-300"
                value={data.admin_email}
                onChange={(event) => setData('admin_email', event.target.value)}
                required
              />
            </Field>

            <Field label="WhatsApp" hint="Com DDI e apenas números." error={errors.admin_whatsapp_phone}>
              <input
                type="tel"
                className="mt-1 block w-full rounded-xl border-slate-300"
                value={data.admin_whatsapp_phone}
                onChange={(event) => setData('admin_whatsapp_phone', event.target.value)}
                placeholder="5511999999999"
              />
            </Field>

            <Field
              label={editingCompany ? 'Nova senha do admin' : 'Senha do admin'}
              hint={editingCompany ? 'Preencha apenas se quiser trocar.' : null}
              error={errors.admin_password}
            >
              <input
                type="password"
                className="mt-1 block w-full rounded-xl border-slate-300"
                value={data.admin_password}
                onChange={(event) => setData('admin_password', event.target.value)}
                required={!editingCompany}
              />
            </Field>
          </section>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={processing}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingCompany ? 'Salvar alterações' : 'Criar empresa'}
            </button>
          </div>
        </form>
      </ModalShell>
    </AuthenticatedLayout>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-base font-semibold text-slate-900">{children}</h3>;
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

function StatusPill({ active, children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
      }`}
    >
      {children}
    </span>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function EmptyBlock({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
      {text}
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

function formatActiveTimeslotMessage(value) {
  const count = Number(value || 0);
  const label = count === 1 ? 'cota ativa' : 'cotas ativas';

  return `Exclua ou feche as ${count} ${label} antes de remover a empresa.`;
}
