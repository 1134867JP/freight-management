import Button from '@/Components/UI/Button';
import FormActions from '@/Components/UI/FormActions';
import FormField from '@/Components/UI/FormField';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
  const { data, setData, post, processing, errors, reset } = useForm({
    password: '',
  });

  const submit = (e) => {
    e.preventDefault();

    post(route('password.confirm'), {
      onFinish: () => reset('password'),
    });
  };

  return (
    <GuestLayout>
      <Head title="Confirmar senha" />

      <div className="mb-4 text-sm text-gray-600">
        Esta é uma área segura. Confirme sua senha para continuar.
      </div>

      <form onSubmit={submit}>
        <FormField id="password" label="Senha" error={errors.password}>
          <FormField.Input
            id="password"
            type="password"
            name="password"
            value={data.password}
            autoFocus
            onChange={(e) => setData('password', e.target.value)}
          />
        </FormField>

        <FormActions className="mt-4">
          <Button type="submit" loading={processing}>
            Confirmar
          </Button>
        </FormActions>
      </form>
    </GuestLayout>
  );
}
