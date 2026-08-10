import Button from '@/Components/UI/Button';
import FormField from '@/Components/UI/FormField';
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
      <Head title="Entrar" />

      <div className="mb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Acesso ao sistema</p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-slate-950">Entrar no CargoHub</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Informe suas credenciais para continuar.</p>
      </div>

      {status && (
        <div role="status" className="mb-4 text-sm font-medium text-green-600">
          {status}
        </div>
      )}

      <form onSubmit={submit} className="space-y-5" noValidate>
        <FormField id="email" label="E-mail" error={errors.email}>
          <FormField.Input
            id="email"
            type="email"
            name="email"
            value={data.email}
            autoComplete="username"
            autoFocus
            onChange={(e) => setData('email', e.target.value)}
          />
        </FormField>

        <FormField id="password" label="Senha" error={errors.password}>
          <FormField.Input
            id="password"
            type="password"
            name="password"
            value={data.password}
            autoComplete="current-password"
            onChange={(e) => setData('password', e.target.value)}
          />
        </FormField>

        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name="remember"
              checked={data.remember}
              onChange={(e) => setData('remember', e.target.checked)}
              className="rounded border-slate-300 text-brand-600 shadow-sm focus:ring-brand-500"
            />
            <span className="text-sm text-slate-600">Manter conectado</span>
          </label>

          {canResetPassword && (
            <Link
              href={route('password.request')}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
            >
              Esqueceu a senha?
            </Link>
          )}
        </div>

        <Button type="submit" size="lg" loading={processing} className="w-full">
          Entrar
        </Button>
      </form>
    </GuestLayout>
  );
}
