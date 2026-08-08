import React, { useCallback, useEffect, useRef, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Button from '@/Components/UI/Button';
import PageHeader from '@/Components/UI/PageHeader';
import { Head } from '@inertiajs/react';

const ZONE_COLORS = {
  parking:      { bg: 'bg-blue-50 dark:bg-blue-950/30',   border: 'border-blue-200 dark:border-blue-800',   header: 'bg-blue-100 dark:bg-blue-900/40',  text: 'text-blue-700 dark:text-blue-300',  dot: 'bg-blue-500'  },
  staging:      { bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800', header: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  hazmat:       { bg: 'bg-red-50 dark:bg-red-950/30',     border: 'border-red-200 dark:border-red-800',     header: 'bg-red-100 dark:bg-red-900/40',    text: 'text-red-700 dark:text-red-300',    dot: 'bg-red-500'    },
  refrigerated: { bg: 'bg-cyan-50 dark:bg-cyan-950/30',   border: 'border-cyan-200 dark:border-cyan-800',   header: 'bg-cyan-100 dark:bg-cyan-900/40',  text: 'text-cyan-700 dark:text-cyan-300',  dot: 'bg-cyan-500'   },
  inspection:   { bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800', header: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  gate:         { bg: 'bg-gray-50 dark:bg-gray-800/40',   border: 'border-gray-200 dark:border-gray-700',   header: 'bg-gray-100 dark:bg-gray-700/40',  text: 'text-gray-600 dark:text-gray-400',  dot: 'bg-gray-400'   },
};

const ZONE_LABELS = {
  parking: 'Estacionamento', staging: 'Triagem', hazmat: 'Carga Perigosa',
  refrigerated: 'Refrigerado', inspection: 'Inspeção', gate: 'Portaria',
};

const STATUS_SPOT = {
  available: { bg: 'bg-green-50 dark:bg-green-900/20',  border: 'border-green-200 dark:border-green-800',  label: 'text-green-600 dark:text-green-400'  },
  occupied:  { bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-200 dark:border-amber-800',  label: 'text-amber-600 dark:text-amber-400'  },
  blocked:   { bg: 'bg-gray-100 dark:bg-gray-700/40',   border: 'border-gray-300 dark:border-gray-600',    label: 'text-gray-400 dark:text-gray-500'    },
};

function ElapsedBadge({ minutes, isDetaining }) {
  if (minutes == null) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const label = h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`;
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isDetaining ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
      {label}{isDetaining ? ' !' : ''}
    </span>
  );
}

function SpotCard({ spot }) {
  const cfg = STATUS_SPOT[spot.status] || STATUS_SPOT.available;
  const freight = spot.freight;

  return (
    <div className={`rounded-lg border p-2 text-xs transition ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-center justify-between gap-1">
        <span className={`font-bold ${cfg.label}`}>{spot.nome}</span>
        <div className="flex gap-1">
          {spot.suporta_reefer    && <span title="Reefer" className="text-cyan-500">❄</span>}
          {spot.suporta_hazmat    && <span title="Hazmat" className="text-red-500">⚠</span>}
          {spot.suporta_oversized && <span title="Oversized" className="text-purple-500">⬆</span>}
        </div>
      </div>
      {freight ? (
        <div className="mt-1 space-y-0.5">
          <p className="font-mono font-semibold text-gray-900 dark:text-gray-100 truncate">{freight.truck_plate}</p>
          <p className="text-gray-500 dark:text-gray-400 truncate">{freight.driver_name}</p>
          <div className="flex items-center gap-1 mt-1">
            <ElapsedBadge minutes={freight.dwell_minutes} isDetaining={freight.is_detaining} />
          </div>
        </div>
      ) : (
        <p className="mt-1 text-gray-400 dark:text-gray-500 italic">Livre</p>
      )}
    </div>
  );
}

function DocaCard({ doca }) {
  const isOccupied = doca.status === 'occupied';
  const freight    = doca.freight;

  return (
    <div className={`rounded-lg border p-2 text-xs ${isOccupied ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'}`}>
      <div className="flex items-center justify-between">
        <span className={`font-bold ${isOccupied ? 'text-amber-700 dark:text-amber-400' : 'text-green-700 dark:text-green-400'}`}>{doca.codigo}</span>
        <span className={`h-2 w-2 rounded-full ${isOccupied ? 'bg-amber-500' : 'bg-green-500'}`} />
      </div>
      <p className="text-gray-600 dark:text-gray-300">{doca.nome}</p>
      {freight ? (
        <div className="mt-1">
          <p className="font-mono font-semibold text-gray-900 dark:text-gray-100">{freight.truck_plate}</p>
          <ElapsedBadge minutes={freight.dwell_minutes} isDetaining={freight.is_detaining} />
        </div>
      ) : (
        <p className="mt-1 text-gray-400 italic">Livre</p>
      )}
    </div>
  );
}

export default function YardMap({ initialData }) {
  const [data, setData]       = useState(initialData);
  const wsOk                    = false;
  const timerRef              = useRef(null);

  const refresh = useCallback(() => {
    fetch(route('admin.yard-map.data'))
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(refresh, wsOk ? 30000 : 10000);
    return () => clearInterval(timerRef.current);
  }, [refresh, wsOk]);

  const { zones = [], docas = [], noLocation = [], stats = {} } = data || {};

  const totalSpots    = zones.reduce((s, z) => s + z.spots.length, 0);
  const occupiedSpots = zones.reduce((s, z) => s + z.spots.filter(sp => sp.status === 'occupied').length, 0);

  return (
    <AuthenticatedLayout header={
      <PageHeader
        title="Mapa do Pátio"
        subtitle="Localização em tempo real de todos os veículos"
        actions={<Button variant="secondary" size="sm" onClick={refresh}>Atualizar</Button>}
      />
    }>
      <Head title="Mapa do Pátio" />

      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: 'No pátio',      value: stats.total_no_patio,  color: 'text-gray-900 dark:text-gray-100' },
              { label: 'Em operação',   value: stats.em_operacao,     color: 'text-blue-700 dark:text-blue-400' },
              { label: 'Aguardando',    value: stats.aguardando,      color: 'text-amber-700 dark:text-amber-400' },
              { label: 'Vagas ocup.',   value: `${occupiedSpots}/${totalSpots}`, color: 'text-gray-900 dark:text-gray-100' },
              { label: 'Em detention',  value: stats.em_detention,    color: 'text-red-700 dark:text-red-400' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <p className={`text-2xl font-black ${s.color}`}>{s.value ?? 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Sem localização */}
          {noLocation.length > 0 && (
            <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/20">
              <h3 className="mb-3 text-sm font-bold text-orange-700 dark:text-orange-400">
                Veículos sem localização definida ({noLocation.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {noLocation.map(f => (
                  <span key={f.id} className="rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs font-mono font-semibold text-gray-700 dark:border-orange-800 dark:bg-gray-800 dark:text-gray-300">
                    {f.truck_plate}
                    <span className="ml-1 font-normal text-gray-400">{f.driver_name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Docas */}
          {docas.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Docas</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {docas.map(doca => <DocaCard key={doca.id} doca={doca} />)}
              </div>
            </div>
          )}

          {/* Zonas */}
          {zones.length > 0 ? zones.map(zone => {
            const cfg = ZONE_COLORS[zone.tipo] || ZONE_COLORS.parking;
            const occupied = zone.spots.filter(s => s.status === 'occupied').length;

            return (
              <div key={zone.id} className={`mb-4 rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
                <div className={`flex items-center justify-between px-4 py-2.5 ${cfg.header}`}>
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${cfg.dot}`} />
                    <span className={`text-sm font-bold ${cfg.text}`}>{zone.nome}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.text} bg-white/50 dark:bg-black/20`}>
                      {ZONE_LABELS[zone.tipo] || zone.tipo}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {occupied}/{zone.spots.length} ocupadas
                  </span>
                </div>
                {zone.spots.length === 0 ? (
                  <p className="px-4 py-3 text-sm italic text-gray-400">Nenhuma vaga cadastrada nesta zona.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                    {zone.spots.map(spot => <SpotCard key={spot.id} spot={spot} />)}
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">Nenhuma zona cadastrada.</p>
              <a href={route('yard-zones.index')} className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                Cadastrar zonas e vagas →
              </a>
            </div>
          )}

        </div>
      </div>
    </AuthenticatedLayout>
  );
}
