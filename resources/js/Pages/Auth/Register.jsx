import Button from '@/Components/UI/Button';
import FormActions from '@/Components/UI/FormActions';
import FormField from '@/Components/UI/FormField';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const submit = (e) => {
    e.preventDefault();

    post(route('register'), {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  };

  return (
    <GuestLayout>
      <Head title="Criar conta" />

      <div className="mb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Novo acesso</p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-slate-950">Criar conta</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Cadastre seus dados de acesso ao CargoHub.</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <FormField id="name" label="Nome" error={errors.name} required>
          <FormField.Input
            id="name"
            name="name"
            value={data.name}
            autoComplete="name"
            autoFocus
            onChange={(e) => setData('name', e.target.value)}
            required
          />
        </FormField>

        <FormField id="email" label="E-mail" error={errors.email} required>
          <FormField.Input
            id="email"
            type="email"
            name="email"
            value={data.email}
            autoComplete="username"
            onChange={(e) => setData('email', e.target.value)}
            required
          />
        </FormField>

        <FormField id="password" label="Senha" error={errors.password} required>
          <FormField.Input
            id="password"
            type="password"
            name="password"
            value={data.password}
            autoComplete="new-password"
            onChange={(e) => setData('password', e.target.value)}
            required
          />
        </FormField>

        <FormField
          id="password_confirmation"
          label="Confirmar senha"
          error={errors.password_confirmation}
          required
        >
          <FormField.Input
            id="password_confirmation"
            type="password"
            name="password_confirmation"
            value={data.password_confirmation}
            autoComplete="new-password"
            onChange={(e) => setData('password_confirmation', e.target.value)}
            required
          />
        </FormField>

        <FormActions>
          <Link
            href={route('login')}
            className="self-center text-sm text-brand-600 hover:text-brand-700 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            Já possui uma conta?
          </Link>

          <Button type="submit" loading={processing}>
            Criar conta
          </Button>
        </FormActions>
      </form>
    </GuestLayout>
  );
}
