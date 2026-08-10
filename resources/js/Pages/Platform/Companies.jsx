import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FlashMessages from '@/Components/UI/FlashMessages';
import FormActions from '@/Components/UI/FormActions';
import FormField from '@/Components/UI/FormField';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import StatusBadge from '@/Components/UI/StatusBadge';
import { useConfirm } from '@/Components/UI/ConfirmModal';
import Button from '@/Components/UI/Button';
import { formatPhone } from '@/utils/formatters';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

function initialFormData() {
  return {
    company_name: '',
    company_slug: '',
    company_is_active: true,
    uses_queues: true,
    uses_docks: true,
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
      uses_queues: Boolean(company.uses_queues ?? true),
      uses_docks: Boolean(company.uses_docks ?? true),
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

  const confirm = useConfirm();

  const deleteCompany = async (company) => {
    if (!company.can_delete) {
      return;
    }

    const ok = await confirm(`Tem certeza que deseja excluir a empresa ${company.name}? Esta ação removerá os dados vinculados.`);
    if (!ok) return;

    router.delete(route('platform.companies.destroy', company.id), {
      preserveScroll: true,
    });
  };

  const deleteInstance = async (companyId) => {
    const ok = await confirm('Excluir instância WhatsApp desta empresa? Esta ação remove a conexão no provedor.');
    if (!ok) return;

    router.delete(route('platform.companies.instance.destroy', companyId), {
      preserveScroll: true,
    });
  };

  const logoPreviewUrl = data.remove_logo ? null : selectedLogoUrl ?? currentLogoUrl;

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Painel Global"
          subtitle="Cadastre empresas, gerencie admins e acompanhe o status de conexão WhatsApp de cada empresa."
          actions={
            <Button
              onClick={openCreate}
            >
              + Nova Empresa
            </Button>
          }
        />
      }
    >
      <Head title="Painel Global" />

      <div className="py-6">
        <div className="mx-auto max-w-[1600px] space-y-6 px-4 sm:px-6 lg:px-8">
          <FlashMessages />

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p className="text-xs font-medium text-slate-500 dark:text-gray-400">{card.label}</p>
                <p className={`mt-1.5 text-2xl font-bold tabular-nums ${card.tone}`}>{card.value}</p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {companies.map((company) => (
              <article key={company.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-col gap-5 border-b border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900/40">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold">{company.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{company.name}</h3>
                        <StatusBadge
                          label={company.is_active ? 'Ativa' : 'Inativa'}
                          tone={company.is_active ? 'success' : 'neutral'}
                        />
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Slug: {company.slug}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => openEdit(company)}
                        variant="secondary"
                        size="sm"
                      >
                        Editar empresa
                      </Button>
                      <Button
                        onClick={() => deleteCompany(company)}
                        disabled={!company.can_delete}
                        variant="danger"
                        size="sm"
                        className={
                          company.can_delete
                            ? ''
                            : 'cursor-not-allowed'
                        }
                      >
                        Excluir empresa
                      </Button>
                    </div>

                    {!company.can_delete && (
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        {formatActiveTimeslotMessage(company.stats.active_timeslots_count)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <SectionTitle>Admin principal</SectionTitle>
                    {company.admin ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-gray-700">
                        <p className="font-medium text-slate-900 dark:text-gray-100">{company.admin.name}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">{company.admin.email}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-gray-500">WhatsApp: {formatPhone(company.admin.whatsapp_phone, 'Não informado')}</p>
                      </div>
                    ) : (
                      <EmptyBlock text="Nenhum admin cadastrado." />
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <MiniStat label="Admins" value={company.stats.company_admins_count} />
                      <MiniStat label="Clientes" value={company.stats.clients_count} />
                      <MiniStat label="Janelas" value={company.stats.timeslots_count} />
                      <MiniStat label="Fretes" value={company.stats.freights_count} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <SectionTitle>WhatsApp</SectionTitle>
                    {company.whatsapp_instance ? (
                      <div className="rounded-lg border border-slate-200 p-4 dark:border-gray-700">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-gray-100">
                              {company.whatsapp_instance.instance_name}
                            </p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                              {formatState(company.whatsapp_instance.connection_state)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex h-2.5 w-2.5 rounded-full ${company.whatsapp_instance.connected ? 'bg-emerald-500' : 'bg-red-400'}`}
                            />
                            <Button
                              onClick={() => deleteInstance(company.id)}
                              variant="ghost"
                              size="sm"
                              className="h-auto px-0 py-0 text-red-500 hover:bg-transparent hover:text-red-700 dark:text-red-400 dark:hover:bg-transparent dark:hover:text-red-300"
                            >
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <EmptyBlock text="Instância será criada automaticamente ao salvar a empresa." />
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

            <FormField label="Nome da empresa" error={errors.company_name}>
              <FormField.Input
                type="text"
                error={errors.company_name}
                value={data.company_name}
                onChange={(event) => setData('company_name', event.target.value)}
                required
              />
            </FormField>

            <FormField label="Slug" hint="Se vazio, será gerado a partir do nome." error={errors.company_slug}>
              <FormField.Input
                type="text"
                error={errors.company_slug}
                value={data.company_slug}
                onChange={(event) => setData('company_slug', event.target.value)}
                placeholder="minha-empresa"
              />
            </FormField>

            <FormField label="Logo" hint="PNG ou JPG até 2MB." error={errors.logo}>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className={`mt-1 block w-full text-sm text-slate-600 ${errors.logo ? 'text-red-600' : ''}`}
                onChange={(event) => {
                  const file = event.target.files[0] ?? null;
                  setData('logo', file);

                  if (file) {
                    setData('remove_logo', false);
                  }
                }}
              />
            </FormField>

            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-gray-700 dark:bg-slate-950/30">
              <p className="text-sm font-medium text-slate-700 dark:text-gray-300">Status e branding</p>
              <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={Boolean(data.company_is_active)}
                  onChange={(event) => setData('company_is_active', event.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                Empresa ativa
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-gray-300">
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

            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-gray-700 dark:bg-slate-950/30">
              <p className="text-sm font-medium text-slate-700 dark:text-gray-300">Módulos</p>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={Boolean(data.uses_queues)}
                  onChange={(e) => setData('uses_queues', e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                <span>
                  Filas / Operação
                  <span className="ml-1 text-xs text-slate-400">(portaria, status de frete, pátio)</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={Boolean(data.uses_docks)}
                  onChange={(e) => setData('uses_docks', e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                <span>
                  Docas
                  <span className="ml-1 text-xs text-slate-400">(atribuição de doca a janelas e fretes)</span>
                </span>
              </label>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <SectionTitle>Admin principal</SectionTitle>
            </div>

            <FormField label="Nome" error={errors.admin_name}>
              <FormField.Input
                type="text"
                error={errors.admin_name}
                value={data.admin_name}
                onChange={(event) => setData('admin_name', event.target.value)}
                required
              />
            </FormField>

            <FormField label="Email" error={errors.admin_email}>
              <FormField.Input
                type="email"
                error={errors.admin_email}
                value={data.admin_email}
                onChange={(event) => setData('admin_email', event.target.value)}
                required
              />
            </FormField>

            <FormField label="WhatsApp" hint="Com DDI e apenas números." error={errors.admin_whatsapp_phone}>
              <FormField.Input
                type="tel"
                error={errors.admin_whatsapp_phone}
                value={data.admin_whatsapp_phone}
                onChange={(event) => setData('admin_whatsapp_phone', event.target.value)}
                placeholder="5511999999999"
              />
            </FormField>

            <FormField
              label={editingCompany ? 'Nova senha do admin' : 'Senha do admin'}
              hint={editingCompany ? 'Preencha apenas se quiser trocar.' : null}
              error={errors.admin_password}
            >
              <FormField.Input
                type="password"
                error={errors.admin_password}
                value={data.admin_password}
                onChange={(event) => setData('admin_password', event.target.value)}
                required={!editingCompany}
              />
            </FormField>
          </section>

          <FormActions className="border-t border-slate-200 pt-6">
            <Button
              onClick={resetForm}
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={processing} variant="primary">
              {editingCompany ? 'Salvar alterações' : 'Criar empresa'}
            </Button>
          </FormActions>
        </form>
      </ModalShell>
    </AuthenticatedLayout>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-base font-semibold text-slate-900 dark:text-gray-100">{children}</h3>;
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-700">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

function EmptyBlock({ text }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-gray-700 dark:bg-gray-700/30 dark:text-gray-400">
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
  const label = count === 1 ? 'janela ativa' : 'janelas ativas';

  return `Exclua ou feche as ${count} ${label} antes de remover a empresa.`;
}
