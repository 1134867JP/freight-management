import Button from '@/Components/UI/Button';
import FormActions from '@/Components/UI/FormActions';
import FormField from '@/Components/UI/FormField';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    token: token,
    email: email,
    password: '',
    password_confirmation: '',
  });

  const submit = (e) => {
    e.preventDefault();

    post(route('password.store'), {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  };

  return (
    <GuestLayout>
      <Head title="Redefinir senha" />

      <form onSubmit={submit} className="space-y-4">
        <FormField id="email" label="E-mail" error={errors.email}>
          <FormField.Input
            id="email"
            type="email"
            name="email"
            value={data.email}
            autoComplete="username"
            onChange={(e) => setData('email', e.target.value)}
          />
        </FormField>

        <FormField id="password" label="Nova senha" error={errors.password}>
          <FormField.Input
            id="password"
            type="password"
            name="password"
            value={data.password}
            autoComplete="new-password"
            autoFocus
            onChange={(e) => setData('password', e.target.value)}
          />
        </FormField>

        <FormField
          id="password_confirmation"
          label="Confirmar nova senha"
          error={errors.password_confirmation}
        >
          <FormField.Input
            type="password"
            id="password_confirmation"
            name="password_confirmation"
            value={data.password_confirmation}
            autoComplete="new-password"
            onChange={(e) => setData('password_confirmation', e.target.value)}
          />
        </FormField>

        <FormActions>
          <Button type="submit" loading={processing}>
            Redefinir senha
          </Button>
        </FormActions>
      </form>
    </GuestLayout>
  );
}
