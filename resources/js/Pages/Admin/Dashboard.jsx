import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ stats }) {
  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
          Painel do Administrador
        </h2>
      }
    >
      <Head title="Painel do Administrador" />

      <div className="py-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Horários anunciados</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats?.total_timeslots ?? 0}</p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Disponíveis</p>
              <p className="mt-2 text-3xl font-bold text-green-700">
                {stats?.available_timeslots ?? 0}
              </p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Reservados</p>
              <p className="mt-2 text-3xl font-bold text-blue-700">
                {stats?.reserved_timeslots ?? 0}
              </p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Lotados</p>
              <p className="mt-2 text-3xl font-bold text-orange-600">
                {stats?.full_timeslots ?? 0}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link
              href={route('timeslots.index')}
              className="rounded-lg bg-white p-6 shadow-sm transition hover:bg-gray-50"
            >
              <h3 className="text-lg font-bold text-gray-900">Gerenciar Horários</h3>
              <p className="mt-2 text-gray-600">Criar, editar e fechar horários da operação.</p>
            </Link>

            <Link
              href={route('admin.agenda')}
              className="rounded-lg bg-white p-6 shadow-sm transition hover:bg-gray-50"
            >
              <h3 className="text-lg font-bold text-gray-900">Agenda</h3>
              <p className="mt-2 text-gray-600">
                Ver horários anunciados e os clientes que reservaram.
              </p>
            </Link>

            <Link
              href={route('freights.approvalList')}
              className="rounded-lg bg-white p-6 shadow-sm transition hover:bg-gray-50"
            >
              <h3 className="text-lg font-bold text-gray-900">Aprovação de Fretes</h3>
              <p className="mt-2 text-gray-600">Aprovar ou rejeitar solicitações dos clientes.</p>
            </Link>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
