import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import Card from '@/Components/UI/Card';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import StatusBadge from '@/Components/UI/StatusBadge';
import { formatPeriod, formatTons } from '@/Features/Quota/format';
import { Head, Link } from '@inertiajs/react';

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-areia-100 px-2.5 py-1 text-[13px] font-medium text-areia-700 dark:bg-areia-800 dark:text-areia-200">
      {children}
    </span>
  );
}

function hoursRange(hours = []) {
  if (!hours.length) return null;
  const sorted = [...hours].sort();
  return sorted.length === 1 ? sorted[0] : `${sorted[0]}–${sorted[sorted.length - 1]}`;
}

function QuotaCard({ quota }) {
  const available = quota.available_for_me ?? 0;
  const hasBalance = available > 0;
  const range = hoursRange(quota.hours);
  const docs = [
    quota.requires_invoice && 'NF',
    quota.requires_weight_ticket && 'Comprovante de peso',
  ].filter(Boolean);

  return (
    <Card className={hasBalance ? '' : 'opacity-80'}>
      <Card.Content className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-areia-900 dark:text-white">
              {quota.product_name} → {quota.destination}
            </h2>
            <p className="mt-0.5 text-sm text-areia-600 dark:text-areia-400">
              {quota.operation_label} · {quota.code}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {quota.is_exclusive && <StatusBadge label="Reservada para você" tone="brand" />}
            {quota.lifecycle?.key === 'scheduled' && <StatusBadge label={quota.lifecycle.label} tone={quota.lifecycle.tone} />}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-[15px] sm:grid-cols-3">
          <div>
            <dt className="text-[13px] text-areia-600 dark:text-areia-400">Período</dt>
            <dd className="font-semibold text-areia-900 dark:text-areia-100">
              {formatPeriod(quota.starts_on, quota.ends_on)}
              {range && <span className="block text-sm font-normal text-areia-600 dark:text-areia-400">{range}</span>}
            </dd>
          </div>
          <div>
            <dt className="text-[13px] text-areia-600 dark:text-areia-400">Peso por carga</dt>
            <dd className="font-semibold text-areia-900 dark:text-areia-100">{formatTons(quota.expected_weight_kg)}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-[13px] text-areia-600 dark:text-areia-400">Documentos</dt>
            <dd className="mt-0.5 flex flex-wrap gap-1.5">
              {docs.length > 0 ? docs.map((doc) => <Chip key={doc}>{doc}</Chip>) : <span className="text-areia-500">Nenhum obrigatório</span>}
            </dd>
          </div>
        </dl>

        {quota.rules && (
          <details className="group rounded-lg border border-areia-200 px-3 py-2 dark:border-areia-800">
            <summary className="cursor-pointer text-[15px] font-semibold text-areia-700 dark:text-areia-300">Regras</summary>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-areia-700 dark:text-areia-300">{quota.rules}</p>
          </details>
        )}

        <div className="flex flex-col gap-3 border-t border-areia-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-areia-800">
          {hasBalance ? (
            <p className="text-[22px] font-bold text-pinho-700 dark:text-pinho-300">
              {available} {available === 1 ? 'disponível' : 'disponíveis'} para você
            </p>
          ) : (
            <p className="text-lg font-semibold text-areia-500 dark:text-areia-400">Sem saldo</p>
          )}
          {hasBalance ? (
            <Link href={route('client.quotas.book', quota.id)}>
              <Button size="lg" className="w-full sm:w-auto">Agendar</Button>
            </Link>
          ) : (
            <Button size="lg" disabled className="w-full sm:w-auto">Agendar</Button>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}

export default function QuotasIndex({ quotas = [] }) {
  return (
    <AuthenticatedLayout>
      <Head title="Cotas disponíveis" />
      <div className="py-6">
        <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
          <FlashMessages />

          <div>
            <p className="mb-1 text-[15px] font-semibold text-pinho-700 dark:text-pinho-300">Cotas</p>
            <h1 className="text-[28px] font-bold leading-tight text-areia-900 dark:text-white">Cotas disponíveis</h1>
            <p className="mt-1.5 text-base text-areia-600 dark:text-areia-400">
              Escolha uma cota e reserve o dia e o horário por aqui, sem precisar pedir pelo WhatsApp.
            </p>
          </div>

          {quotas.length === 0 ? (
            <Card>
              <EmptyState
                title="Nenhuma cota disponível no momento."
                description="Você será avisado pelo WhatsApp quando a empresa publicar novas cotas."
                action={<Link href={route('client.bookings')}><Button variant="secondary">Ver meus agendamentos</Button></Link>}
              />
            </Card>
          ) : (
            <div className="space-y-4">
              {quotas.map((quota) => <QuotaCard key={quota.id} quota={quota} />)}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
