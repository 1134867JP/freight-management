import Button from '@/Components/UI/Button';
import FormActions from '@/Components/UI/FormActions';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
  const { post, processing } = useForm({});

  const submit = (e) => {
    e.preventDefault();

    post(route('verification.send'));
  };

  return (
    <GuestLayout>
      <Head title="Verificar e-mail" />

      <div className="mb-4 text-sm text-gray-600">
        Antes de começar, confirme seu endereço de e-mail pelo link que enviamos. Caso não tenha
        recebido, você pode solicitar um novo link.
      </div>

      {status === 'verification-link-sent' && (
        <div role="status" className="mb-4 text-sm font-medium text-green-600">
          Um novo link de verificação foi enviado para o seu endereço de e-mail.
        </div>
      )}

      <form onSubmit={submit}>
        <FormActions className="mt-4 sm:justify-between">
          <Button type="submit" loading={processing}>
            Reenviar e-mail de verificação
          </Button>

          <Link
            href={route('logout')}
            method="post"
            as="button"
            className="self-center text-sm text-brand-600 hover:text-brand-700 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            Sair
          </Link>
        </FormActions>
      </form>
    </GuestLayout>
  );
}
