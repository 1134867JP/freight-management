import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ConfirmProvider } from '@/Components/UI/ConfirmModal';
import ErrorBoundary from '@/Components/UI/ErrorBoundary';

const appName = import.meta.env.VITE_APP_NAME || 'CargoHub YMS';
const pages = import.meta.glob('./Pages/**/*.jsx');

/*
 * Baixa em segundo plano as telas da área do usuário (Admin ou Client) quando o
 * navegador fica ocioso. Assim o primeiro clique em cada tela não espera mais um
 * download no 4G. Respeita o modo de economia de dados.
 */
function warmUpPages(currentPage) {
  const area = currentPage.split('/')[0];
  if (!['Admin', 'Client'].includes(area) || navigator.connection?.saveData) return;

  const whenIdle = window.requestIdleCallback ?? ((callback) => setTimeout(callback, 2000));
  whenIdle(() => {
    Object.entries(pages)
      .filter(([path]) => path.startsWith(`./Pages/${area}/`))
      .forEach(([, load]) => load().catch(() => {}));
  });
}

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) =>
    resolvePageComponent(`./Pages/${name}.jsx`, pages),
  setup({ el, App, props }) {
    const root = createRoot(el);
    warmUpPages(props.initialPage.component);

    root.render(
      <ErrorBoundary>
        <ConfirmProvider>
          <App {...props} />
        </ConfirmProvider>
      </ErrorBoundary>
    );
  },
  progress: {
    color: '#2563EB',
  },
});
