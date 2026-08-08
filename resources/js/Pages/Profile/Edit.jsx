import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/UI/PageHeader';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdateThemeForm from './Partials/UpdateThemeForm';

export default function Edit({ mustVerifyEmail, status }) {
  return (
    <AuthenticatedLayout
      header={
        <PageHeader title="Perfil" subtitle="Gerencie suas informações, senha e preferências." />
      }
    >
      <Head title="Perfil" />

      <div className="py-8">
        <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-8 dark:border-gray-700 dark:bg-gray-800">
            <UpdateProfileInformationForm
              mustVerifyEmail={mustVerifyEmail}
              status={status}
              className="max-w-xl"
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-8 dark:border-gray-700 dark:bg-gray-800">
            <UpdatePasswordForm className="max-w-xl" />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-8 dark:border-gray-700 dark:bg-gray-800">
            <UpdateThemeForm className="max-w-xl" />
          </div>

          <div className="rounded-lg border border-red-200 bg-white p-5 shadow-sm sm:p-8 dark:border-red-900/60 dark:bg-gray-800">
            <DeleteUserForm className="max-w-xl" />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
