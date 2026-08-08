import Button from '@/Components/UI/Button';
import FormActions from '@/Components/UI/FormActions';
import FormField from '@/Components/UI/FormField';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {
  const user = usePage().props.auth.user;

  const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
    name: user.name,
    email: user.email,
    whatsapp_phone: user.whatsapp_phone ?? '',
  });

  const submit = (e) => {
    e.preventDefault();

    patch(route('profile.update'));
  };

  return (
    <section className={className}>
      <header>
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Informações do Perfil
        </h2>

        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Atualize as informações do seu perfil e endereço de email.
        </p>
      </header>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <FormField id="name" label="Nome" error={errors.name} required>
          <FormField.Input
            id="name"
            value={data.name}
            onChange={(e) => setData('name', e.target.value)}
            required
            autoFocus
            autoComplete="name"
          />
        </FormField>

        <FormField id="email" label="E-mail" error={errors.email} required>
          <FormField.Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => setData('email', e.target.value)}
            required
            autoComplete="username"
          />
        </FormField>

        <FormField
          id="whatsapp_phone"
          label="WhatsApp"
          error={errors.whatsapp_phone}
          hint="Use o número com DDI e apenas números."
        >
          <FormField.Input
            id="whatsapp_phone"
            type="tel"
            value={data.whatsapp_phone}
            onChange={(e) => setData('whatsapp_phone', e.target.value)}
            autoComplete="tel"
            inputMode="numeric"
            placeholder="5511999999999"
          />
        </FormField>

        {mustVerifyEmail && user.email_verified_at === null && (
          <div>
            <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
              Seu endereço de email não foi verificado.{' '}
              <Link
                href={route('verification.send')}
                method="post"
                as="button"
                className="text-brand-600 underline hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                Clique aqui para reenviar o email de verificação.
              </Link>
            </p>

            {status === 'verification-link-sent' && (
              <div role="status" className="mt-2 text-sm font-medium text-green-600">
                Um novo link de verificação foi enviado para o seu endereço de email.
              </div>
            )}
          </div>
        )}

        <FormActions className="items-center sm:justify-start">
          <Button type="submit" loading={processing}>
            Salvar
          </Button>

          <Transition
            show={recentlySuccessful}
            enter="transition ease-in-out"
            enterFrom="opacity-0"
            leave="transition ease-in-out"
            leaveTo="opacity-0"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">Salvo.</p>
          </Transition>
        </FormActions>
      </form>
    </section>
  );
}
