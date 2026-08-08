import Button from '@/Components/UI/Button';
import FormActions from '@/Components/UI/FormActions';
import FormField from '@/Components/UI/FormField';
import ModalShell from '@/Components/UI/ModalShell';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
  const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
  const passwordInput = useRef();

  const {
    data,
    setData,
    delete: destroy,
    processing,
    reset,
    errors,
    clearErrors,
  } = useForm({
    password: '',
  });

  const confirmUserDeletion = () => {
    setConfirmingUserDeletion(true);
  };

  const deleteUser = (e) => {
    e.preventDefault();

    destroy(route('profile.destroy'), {
      preserveScroll: true,
      onSuccess: () => closeModal(),
      onError: () => passwordInput.current.focus(),
      onFinish: () => reset(),
    });
  };

  const closeModal = () => {
    setConfirmingUserDeletion(false);

    clearErrors();
    reset();
  };

  return (
    <section className={`space-y-6 ${className}`}>
      <header>
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Excluir Conta</h2>

        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Após excluir sua conta, todos os recursos e dados serão permanentemente apagados. Antes de
          excluir, faça o download de qualquer dado que deseja manter.
        </p>
      </header>

      <Button variant="danger" onClick={confirmUserDeletion}>
        Excluir conta
      </Button>

      <ModalShell
        show={confirmingUserDeletion}
        title="Excluir conta?"
        onClose={closeModal}
        footer={
          <FormActions>
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" form="delete-user-form" variant="danger" loading={processing}>
              Excluir conta
            </Button>
          </FormActions>
        }
      >
        <form id="delete-user-form" onSubmit={deleteUser}>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Após excluir sua conta, todos os recursos e dados serão permanentemente apagados. Digite
            sua senha para confirmar a exclusão permanente.
          </p>

          <FormField id="delete-password" label="Senha" error={errors.password} className="mt-6">
            <FormField.Input
              id="delete-password"
              type="password"
              name="password"
              ref={passwordInput}
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              placeholder="Senha"
              autoComplete="current-password"
            />
          </FormField>
        </form>
      </ModalShell>
    </section>
  );
}
