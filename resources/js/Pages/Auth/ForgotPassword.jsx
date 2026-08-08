import Button from '@/Components/UI/Button';
import FormActions from '@/Components/UI/FormActions';
import FormField from '@/Components/UI/FormField';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
  });

  const submit = (e) => {
    e.preventDefault();

    post(route('password.email'));
  };

  return (
    <GuestLayout>
      <Head title="Recuperar senha" />

      <div className="mb-4 text-sm text-gray-600">
        Informe seu e-mail e enviaremos um link para você criar uma nova senha.
      </div>

      {status && (
        <div role="status" className="mb-4 text-sm font-medium text-green-600">
          {status}
        </div>
      )}

      <form onSubmit={submit}>
        <FormField id="email" label="E-mail" error={errors.email}>
          <FormField.Input
            id="email"
            type="email"
            name="email"
            value={data.email}
            autoFocus
            onChange={(e) => setData('email', e.target.value)}
          />
        </FormField>

        <FormActions className="mt-4">
          <Button type="submit" loading={processing}>
            Enviar link de recuperação
          </Button>
        </FormActions>
      </form>
    </GuestLayout>
  );
}
