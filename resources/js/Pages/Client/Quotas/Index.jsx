import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import Card from '@/Components/UI/Card';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import IconTile from '@/Components/UI/IconTile';
import PageHeader from '@/Components/UI/PageHeader';
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

function Fact({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] font-bold uppercase tracking-[0.08em] text-areia-500 dark:text-areia-400">{label}</dt>
      <dd className="mt-1 text-[15px] font-semibold text-areia-900 dark:text-areia-100">{children}</dd>
    </div>
  );
}

function hoursRange(hours = []) {
  if (!hours.length) return null;
  const sorted = [...hours].sort();
  return sorted.length === 1 ? sorted[0] : `${sorted[0]}–${sorted[sorted.length - 1]}`;
}

function AvailabilityBar({ quota, available }) {
  const total = Number(quota.allocated_to_me ?? quota.remaining_total ?? 0);
  if (!(total > 0) || available <= 0) return null;
  const pct = Math.min(Math.round((available / total) * 100), 100);
  return (
    <div className="mt-2 max-w-[220px]">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-areia-200 dark:bg-areia-700" role="img" aria-label={`${available} de ${total}`}>
        <div className="h-full rounded-full bg-pinho-600 dark:bg-pinho-400" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[12px] text-areia-500 dark:text-areia-400">
        de {total} {quota.allocated_to_me != null ? 'reservadas' : 'restantes na cota'}
      </p>
    </div>
  );
}

function QuotaCard({ quota }) {
  const available = quota.available_for_me ?? 0;
  const hasBalance = available > 0;
  const range = hoursRange(quota.hours);
  const docs = [
    quota.requires_invoice && 'NF',
    quota.requires_weight_ticket && 'Comprovante de peso',
  ].filter(Boolean);
  const hasWeight = quota.expected_weight_kg !== null && quota.expected_weight_kg !== undefined && quota.expected_weight_kg !== '';

  return (
    <Card className={`overflow-hidden ${hasBalance ? '' : 'opacity-80'}`}>
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <IconTile tone={hasBalance ? 'brand' : 'neutral'} size="lg">{String(quota.product_name ?? '?').charAt(0).toUpperCase()}</IconTile>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
              <h2 className="min-w-0 font-display text-xl font-bold leading-snug text-areia-900 dark:text-white">
                {quota.product_name} → {quota.destination}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {quota.is_exclusive && <StatusBadge label="Reservada para você" tone="brand" />}
                {quota.lifecycle?.key === 'scheduled' && <StatusBadge label={quota.lifecycle.label} tone={quota.lifecycle.tone} />}
              </div>
            </div>
            <p className="mt-0.5 text-sm text-areia-600 dark:text-areia-400">
              {quota.operation_label} · {quota.code}
            </p>
          </div>
        </div>

        <dl className={`grid grid-cols-2 gap-x-4 gap-y-4 border-t border-areia-100 pt-5 dark:border-areia-800 ${hasWeight ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          <Fact label="Período">
            {formatPeriod(quota.starts_on, quota.ends_on)}
            {range && <span className="block text-sm font-normal text-areia-600 dark:text-areia-400">{range}</span>}
          </Fact>
          {hasWeight && <Fact label="Peso por carga">{formatTons(quota.expected_weight_kg)}</Fact>}
          <div className={`min-w-0 ${hasWeight ? 'col-span-2 sm:col-span-1' : ''}`}>
            <dt className="text-[12px] font-bold uppercase tracking-[0.08em] text-areia-500 dark:text-areia-400">Documentos</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {docs.length > 0 ? docs.map((doc) => <Chip key={doc}>{doc}</Chip>) : <span className="text-[15px] text-areia-500 dark:text-areia-400">Nenhum obrigatório</span>}
            </dd>
          </div>
        </dl>

        {quota.rules && (
          <details className="group rounded-xl bg-areia-50 px-4 py-3 dark:bg-areia-800/50">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[15px] font-semibold text-areia-700 dark:text-areia-200 [&::-webkit-details-marker]:hidden">
              Regras
              <svg className="h-4 w-4 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-areia-700 dark:text-areia-300">{quota.rules}</p>
          </details>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-areia-200 bg-areia-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-areia-800 dark:bg-areia-800/40">
        {hasBalance ? (
          <div>
            <p className="font-display text-[24px] font-bold leading-tight text-pinho-700 dark:text-pinho-300">
              <span className="tabular-nums">{available}</span> {available === 1 ? 'disponível' : 'disponíveis'} para você
            </p>
            <AvailabilityBar quota={quota} available={available} />
          </div>
        ) : (
          <p className="font-display text-lg font-semibold text-areia-500 dark:text-areia-400">Sem saldo</p>
        )}
        {hasBalance ? (
          <Link href={route('client.quotas.book', quota.id)}>
            <Button size="lg" className="w-full sm:w-auto">Agendar</Button>
          </Link>
        ) : (
          <Button size="lg" disabled className="w-full sm:w-auto">Agendar</Button>
        )}
      </div>
    </Card>
  );
}

export default function QuotasIndex({ quotas = [] }) {
  return (
    <AuthenticatedLayout>
      <Head title="Cotas disponíveis" />
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <FlashMessages />

        <div>
          <PageHeader
            title="Cotas disponíveis"
            subtitle="Escolha uma cota e reserve o dia e o horário por aqui, sem precisar pedir pelo WhatsApp."
          />

          {quotas.length === 0 ? (
            <Card>
              <EmptyState
                icon={(
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
                    <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
                  </svg>
                )}
                title="Nenhuma cota disponível no momento."
                description="Você será avisado pelo WhatsApp quando a empresa publicar novas cotas."
                action={<Link href={route('client.bookings')}><Button variant="secondary">Ver meus agendamentos</Button></Link>}
              />
            </Card>
          ) : (
            <div className="space-y-5">
              {quotas.map((quota) => <QuotaCard key={quota.id} quota={quota} />)}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
