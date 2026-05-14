import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 dark:bg-gray-900">
          <p className="text-5xl font-black text-gray-200 dark:text-gray-700">!</p>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">Algo deu errado</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Ocorreu um erro inesperado. Recarregue a página ou tente novamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Recarregar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
