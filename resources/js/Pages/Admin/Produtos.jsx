import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EmptyState from '@/Components/UI/EmptyState';
import FlashMessages from '@/Components/UI/FlashMessages';
import ModalShell from '@/Components/UI/ModalShell';
import PageHeader from '@/Components/UI/PageHeader';
import FormField from '@/Components/UI/FormField';
import { confirmAction } from '@/Components/UI/confirmAction';
import { Head, useForm, router } from '@inertiajs/react';
import Button from '@/Components/UI/Button';

function ProdutoIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export default function Produtos({ produtos }) {
  const [editingProduto, setEditingProduto] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const arrProdutos = produtos || [];

  const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
    nome: '',
    descricao: '',
    is_active: true,
  });

  const blIsEditing = Boolean(editingProduto?.id);

  const resetForm = () => {
    setEditingProduto(null);
    setShowCreateModal(false);
    clearErrors();
    reset();
  };

  const startEdit = (objProduto) => {
    setEditingProduto(objProduto);
    setData({
      nome: objProduto.nome || '',
      descricao: objProduto.descricao || '',
      is_active: objProduto.is_active ?? true,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (blIsEditing) {
      patch(route('produtos.update', editingProduto.id), {
        onSuccess: () => resetForm(),
        preserveScroll: true,
      });
      return;
    }

    post(route('produtos.store'), {
      onSuccess: () => resetForm(),
      preserveScroll: true,
    });
  };

  const handleDelete = (objProduto) => {
    if (!confirmAction(`Excluir produto "${objProduto.nome}"?`)) return;
    router.delete(route('produtos.destroy', objProduto.id), { preserveScroll: true });
  };

  const strModalTitle = blIsEditing ? 'Editar Produto' : 'Novo Produto';

  const activeCount = arrProdutos.filter((p) => p.is_active).length;
  const inactiveCount = arrProdutos.length - activeCount;

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Produtos"
          subtitle="Gerencie os produtos vinculáveis às cotas"
          actions={
            <Button onClick={() => setShowCreateModal(true)}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Novo Produto
            </Button>
          }
        />
      }
    >
      <Head title="Produtos" />

      <div className="py-12">
        <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
          <FlashMessages />

          {arrProdutos.length > 0 && (
            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{arrProdutos.length}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 shadow-sm dark:border-green-800 dark:bg-green-900/20">
                <span className="text-2xl font-black text-green-700 dark:text-green-400">{activeCount}</span>
                <span className="text-sm text-green-600 dark:text-green-500">Ativos</span>
              </div>
              {inactiveCount > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-700/40">
                  <span className="text-2xl font-black text-gray-500 dark:text-gray-400">{inactiveCount}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Inativos</span>
                </div>
              )}
            </div>
          )}

          {arrProdutos.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <EmptyState title="Nenhum produto cadastrado." />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {arrProdutos.map((objProduto) => (
                <div
                  key={objProduto.id}
                  className={`group flex flex-col rounded-xl border bg-white shadow-sm transition hover:shadow-md dark:bg-gray-800 ${
                    objProduto.is_active
                      ? 'border-gray-200 dark:border-gray-700'
                      : 'border-gray-200 opacity-60 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between p-5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        objProduto.is_active
                          ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                      }`}>
                        <ProdutoIcon />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {objProduto.nome}
                        </h3>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                      objProduto.is_active
                        ? 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-800'
                        : 'bg-gray-100 text-gray-500 ring-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-600'
                    }`}>
                      {objProduto.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="flex-1 px-5 pb-4">
                    {objProduto.descricao ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{objProduto.descricao}</p>
                    ) : (
                      <p className="text-sm italic text-gray-400 dark:text-gray-500">Sem descrição</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-3 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => startEdit(objProduto)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                    >
                      <IconEdit />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(objProduto)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                    >
                      <IconTrash />
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ModalShell
        show={showCreateModal || blIsEditing}
        title={strModalTitle}
        onClose={resetForm}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nome" error={errors.nome} required>
            <FormField.Input
              type="text"
              error={errors.nome}
              value={data.nome}
              onChange={(e) => setData('nome', e.target.value)}
              required
            />
          </FormField>

          <FormField label="Descrição" error={errors.descricao}>
            <textarea
              className={`mt-1 block w-full ${FormField.inputClass(errors.descricao)}`}
              value={data.descricao}
              onChange={(e) => setData('descricao', e.target.value)}
              rows="3"
            />
          </FormField>

          <FormField label="Status">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={data.is_active}
                onChange={(e) => setData('is_active', e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Ativo</span>
            </label>
          </FormField>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={resetForm}>Cancelar</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={processing}>{blIsEditing ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </ModalShell>
    </AuthenticatedLayout>
  );
}
