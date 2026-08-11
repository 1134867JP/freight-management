import Button from '@/Components/UI/Button';
import FormField from '@/Components/UI/FormField';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ChangeTemporaryPassword() {
  const { data, setData, put, processing, errors, reset } = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const submit = (event) => {
    event.preventDefault();

    put(route('password.update'), {
      onError: () => reset('password', 'password_confirmation'),
    });
  };

  return (
    <GuestLayout>
      <Head title="Definir nova senha" />

      <div className="mb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">
          Primeiro acesso
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-slate-950">
          Crie sua nova senha
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          A senha informada pelo administrador é temporária. Defina uma nova senha para liberar seu
          acesso ao CargoHub.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5" noValidate>
        <FormField
          id="current_password"
          label="Senha temporária"
          error={errors.current_password}
          required
        >
          <FormField.Input
            id="current_password"
            type="password"
            value={data.current_password}
            autoComplete="current-password"
            autoFocus
            error={errors.current_password}
            onChange={(event) => setData('current_password', event.target.value)}
          />
        </FormField>

        <FormField
          id="password"
          label="Nova senha"
          error={errors.password}
          hint="Use pelo menos 8 caracteres e não repita a senha temporária."
          required
        >
          <FormField.Input
            id="password"
            type="password"
            value={data.password}
            autoComplete="new-password"
            error={errors.password}
            onChange={(event) => setData('password', event.target.value)}
          />
        </FormField>

        <FormField
          id="password_confirmation"
          label="Confirmar nova senha"
          error={errors.password_confirmation}
          required
        >
          <FormField.Input
            id="password_confirmation"
            type="password"
            value={data.password_confirmation}
            autoComplete="new-password"
            error={errors.password_confirmation}
            onChange={(event) => setData('password_confirmation', event.target.value)}
          />
        </FormField>

        <Button type="submit" size="lg" loading={processing} className="w-full">
          Salvar nova senha e continuar
        </Button>
      </form>

      <div className="mt-5 border-t border-slate-200 pt-5 text-center">
        <Link
          href={route('logout')}
          method="post"
          as="button"
          className="text-sm font-semibold text-slate-500 hover:text-slate-800 hover:underline"
        >
          Sair e usar outra conta
        </Link>
      </div>
    </GuestLayout>
  );
}
