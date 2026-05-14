import { Head, Link } from '@inertiajs/react';

const MESSAGES = {
  403: { title: 'Acesso negado', desc: 'Você não tem permissão para acessar esta página.' },
  404: { title: 'Página não encontrada', desc: 'O endereço acessado não existe ou foi removido.' },
  419: { title: 'Sessão expirada', desc: 'Sua sessão expirou. Faça login novamente.' },
  429: { title: 'Muitas requisições', desc: 'Você fez muitas tentativas. Aguarde um momento.' },
  500: { title: 'Erro interno', desc: 'Ocorreu um erro no servidor. Tente novamente em instantes.' },
  503: { title: 'Serviço indisponível', desc: 'O sistema está em manutenção. Tente novamente em breve.' },
};

export default function ErrorPage({ status }) {
  const msg = MESSAGES[status] || { title: `Erro ${status}`, desc: 'Ocorreu um erro inesperado.' };

  return (
    <>
      <Head title={msg.title} />
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 dark:bg-gray-900">
        <p className="text-8xl font-black text-gray-200 dark:text-gray-700">{status}</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">{msg.title}</h1>
        <p className="mt-2 max-w-sm text-center text-sm text-gray-500 dark:text-gray-400">{msg.desc}</p>
        <Link
          href="/"
          className="mt-8 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Voltar ao início
        </Link>
      </div>
    </>
  );
}
