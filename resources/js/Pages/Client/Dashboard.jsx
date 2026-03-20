import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ stats }) {
  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-100">Painel do Cliente</h2>
      }
    >
      <Head title="Painel do Cliente" />

      <div className="py-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          {/* Cards de métricas */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Minhas solicitações</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats?.total_my_freights ?? 0}
              </p>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Carregando</p>
              <p className="mt-2 text-3xl font-bold text-amber-700">
                {stats?.loading_my_freights ?? 0}
              </p>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Descarregando</p>
              <p className="mt-2 text-3xl font-bold text-orange-700">
                {stats?.unloading_my_freights ?? 0}
              </p>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Concluídas</p>
              <p className="mt-2 text-3xl font-bold text-green-700">
                {stats?.completed_my_freights ?? 0}
              </p>
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link
              href={route('client.available')}
              className="rounded-lg bg-white p-6 shadow-sm transition hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Reservar Horário</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Veja Cotas disponíveis e faça sua solicitação.
              </p>
            </Link>

            <Link
              href={route('client.reservations')}
              className="rounded-lg bg-white p-6 shadow-sm transition hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Minhas Reservas</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Acompanhe pendências, aprovações e histórico.</p>
            </Link>

            <Link
              href={route('client.trucks')}
              className="rounded-lg bg-white p-6 shadow-sm transition hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Meus Caminhões</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Cadastre e gerencie as placas usadas nas reservas.
              </p>
            </Link>
          </div>

          {/* Bloco “status rápido” */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Resumo</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Canceladas</p>
                <p className="mt-1 text-2xl font-bold text-red-600">
                  {stats?.cancelled_my_freights ?? 0}
                </p>
              </div>
              <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Cotas disponíveis hoje</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
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
