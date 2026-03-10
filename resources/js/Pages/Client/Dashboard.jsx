import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ stats }) {
  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">Painel do Cliente</h2>
      }
    >
      <Head title="Painel do Cliente" />

      <div className="py-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          {/* Cards de métricas */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Minhas solicitações</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats?.total_my_freights ?? 0}
              </p>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Carregando</p>
              <p className="mt-2 text-3xl font-bold text-amber-700">
                {stats?.loading_my_freights ?? 0}
              </p>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Descarregando</p>
              <p className="mt-2 text-3xl font-bold text-orange-700">
                {stats?.unloading_my_freights ?? 0}
              </p>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Concluídas</p>
              <p className="mt-2 text-3xl font-bold text-green-700">
                {stats?.completed_my_freights ?? 0}
              </p>
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link
              href={route('client.available')}
              className="rounded-lg bg-white p-6 shadow-sm transition hover:bg-gray-50"
            >
              <h3 className="text-lg font-bold text-gray-900">Reservar Horário</h3>
              <p className="mt-2 text-gray-600">
                Veja horários disponíveis e faça sua solicitação.
              </p>
            </Link>

            <Link
              href={route('client.reservations')}
              className="rounded-lg bg-white p-6 shadow-sm transition hover:bg-gray-50"
            >
              <h3 className="text-lg font-bold text-gray-900">Minhas Reservas</h3>
              <p className="mt-2 text-gray-600">Acompanhe pendências, aprovações e histórico.</p>
            </Link>

            <Link
              href={route('client.trucks')}
              className="rounded-lg bg-white p-6 shadow-sm transition hover:bg-gray-50"
            >
              <h3 className="text-lg font-bold text-gray-900">Meus Caminhões</h3>
              <p className="mt-2 text-gray-600">
                Cadastre e gerencie as placas usadas nas reservas.
              </p>
            </Link>
          </div>

          {/* Bloco “status rápido” */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Resumo</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-md bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Canceladas</p>
                <p className="mt-1 text-2xl font-bold text-red-600">
                  {stats?.cancelled_my_freights ?? 0}
                </p>
              </div>
              <div className="rounded-md bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Horários disponíveis hoje</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {stats?.available_today ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
