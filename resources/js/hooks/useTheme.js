import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

function applyTheme(preference) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = preference === 'dark' || (preference === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
}

export function useTheme() {
  const { auth } = usePage().props;
  const preference = auth?.user?.theme_preference ?? 'light';

  useEffect(() => {
    applyTheme(preference);
  }, [preference]);

  useEffect(() => {
    if (preference !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);
}
