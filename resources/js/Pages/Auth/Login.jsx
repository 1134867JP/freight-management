import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const submit = (e) => {
    e.preventDefault();

    post(route('login'), {
      onFinish: () => reset('password'),
    });
  };

  return (
    <GuestLayout>
      <Head title="Log in" />

      {status && <div className="mb-4 text-sm font-medium text-green-600">{status}</div>}

      <form onSubmit={submit} className="space-y-5" noValidate>
        <div>
          <InputLabel htmlFor="email" value="E-mail" />
          <TextInput
            id="email"
            type="email"
            name="email"
            value={data.email}
            className="mt-1.5 block w-full rounded-lg border-gray-200 text-sm shadow-none focus:border-blue-500 focus:ring-blue-500"
            autoComplete="username"
            isFocused={true}
            onChange={(e) => setData('email', e.target.value)}
          />
          <InputError message={errors.email} className="mt-1.5" />
        </div>

        <div>
          <InputLabel htmlFor="password" value="Senha" />
          <TextInput
            id="password"
            type="password"
            name="password"
            value={data.password}
            className="mt-1.5 block w-full rounded-lg border-gray-200 text-sm shadow-none focus:border-blue-500 focus:ring-blue-500"
            autoComplete="current-password"
            onChange={(e) => setData('password', e.target.value)}
          />
          <InputError message={errors.password} className="mt-1.5" />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              name="remember"
              checked={data.remember}
              onChange={(e) => setData('remember', e.target.checked)}
            />
            <span className="text-sm text-gray-500">Lembra-me</span>
          </label>

          {canResetPassword && (
            <Link
              href={route('password.request')}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Esqueceu a senha?
            </Link>
          )}
        </div>

        <button
          type="submit"
          disabled={processing}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {processing ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </GuestLayout>
  );
}
