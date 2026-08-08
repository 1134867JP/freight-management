import Button from '@/Components/UI/Button';
import FormActions from '@/Components/UI/FormActions';
import FormField from '@/Components/UI/FormField';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';

export default function UpdatePasswordForm({ className = '' }) {
  const passwordInput = useRef();
  const currentPasswordInput = useRef();

  const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const updatePassword = (e) => {
    e.preventDefault();

    put(route('password.update'), {
      preserveScroll: true,
      onSuccess: () => reset(),
      onError: (errors) => {
        if (errors.password) {
          reset('password', 'password_confirmation');
          passwordInput.current.focus();
        }

        if (errors.current_password) {
          reset('current_password');
          currentPasswordInput.current.focus();
        }
      },
    });
  };

  return (
    <section className={className}>
      <header>
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Alterar Senha</h2>

        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Use uma senha longa e aleatória para manter sua conta segura.
        </p>
      </header>

      <form onSubmit={updatePassword} className="mt-6 space-y-6">
        <FormField id="current_password" label="Senha atual" error={errors.current_password}>
          <FormField.Input
            id="current_password"
            ref={currentPasswordInput}
            value={data.current_password}
            onChange={(e) => setData('current_password', e.target.value)}
            type="password"
            autoComplete="current-password"
          />
        </FormField>

        <FormField id="password" label="Nova senha" error={errors.password}>
          <FormField.Input
            id="password"
            ref={passwordInput}
            value={data.password}
            onChange={(e) => setData('password', e.target.value)}
            type="password"
            autoComplete="new-password"
          />
        </FormField>

        <FormField
          id="password_confirmation"
          label="Confirmar nova senha"
          error={errors.password_confirmation}
        >
          <FormField.Input
            id="password_confirmation"
            value={data.password_confirmation}
            onChange={(e) => setData('password_confirmation', e.target.value)}
            type="password"
            autoComplete="new-password"
          />
        </FormField>

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
