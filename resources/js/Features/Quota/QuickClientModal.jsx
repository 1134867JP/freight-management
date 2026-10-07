import React from 'react';
import { useForm } from '@inertiajs/react';
import Button from '@/Components/UI/Button';
import FormActions from '@/Components/UI/FormActions';
import FormField from '@/Components/UI/FormField';
import ModalShell from '@/Components/UI/ModalShell';

/*
 * Cadastro rápido de cliente sem sair da publicação da cota. O backend
 * redireciona de volta; `preserveState` mantém o que já foi preenchido na
 * cota e `onCreated` recebe o cliente novo para já liberar a cota para ele.
 */
export default function QuickClientModal({ open, onClose, onCreated }) {
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    name: '',
    email: '',
    whatsapp_phone: '',
    password: '',
  });

  const close = () => {
    reset();
    clearErrors();
    onClose();
  };

  const submit = (event) => {
    event.preventDefault();
    const email = data.email.trim().toLowerCase();

    post(route('clients.store'), {
      preserveState: true,
      preserveScroll: true,
      onSuccess: (page) => {
        const created = (page.props.clients ?? []).find(
          (client) => (client.email ?? '').toLowerCase() === email,
        );
        if (created) onCreated(created);
        close();
      },
    });
  };

  return (
    <ModalShell show={open} onClose={close} title="Cadastrar cliente" maxWidthClass="max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <FormField id="quick-client-name" label="Nome" error={errors.name} required>
          <FormField.Input
            id="quick-client-name"
            value={data.name}
            error={errors.name}
            onChange={(event) => setData('name', event.target.value)}
            required
          />
        </FormField>
        <FormField id="quick-client-email" label="E-mail" error={errors.email} required>
          <FormField.Input
            id="quick-client-email"
            type="email"
            value={data.email}
            error={errors.email}
            onChange={(event) => setData('email', event.target.value)}
            required
          />
        </FormField>
        <FormField
          id="quick-client-whatsapp"
          label="WhatsApp"
          error={errors.whatsapp_phone}
          hint="Com DDI e apenas números. Usado para avisar o saldo da cota."
        >
          <FormField.Input
            id="quick-client-whatsapp"
            type="tel"
            inputMode="numeric"
            placeholder="5511999999999"
            value={data.whatsapp_phone}
            error={errors.whatsapp_phone}
            onChange={(event) => setData('whatsapp_phone', event.target.value)}
          />
        </FormField>
        <FormField
          id="quick-client-password"
          label="Senha temporária"
          error={errors.password}
          hint="O cliente cria uma nova senha no primeiro acesso."
          required
        >
          <FormField.Input
            id="quick-client-password"
            type="password"
            minLength={8}
            value={data.password}
            error={errors.password}
            onChange={(event) => setData('password', event.target.value)}
            required
          />
        </FormField>
        <FormActions>
          <Button variant="secondary" className="flex-1" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" loading={processing}>
            Cadastrar
          </Button>
        </FormActions>
      </form>
    </ModalShell>
  );
}
