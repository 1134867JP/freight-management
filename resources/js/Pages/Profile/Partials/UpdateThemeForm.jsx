import PrimaryButton from '@/Components/PrimaryButton';
import { Transition } from '@headlessui/react';
import { useForm, usePage } from '@inertiajs/react';

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', description: 'Sempre usa o tema claro.' },
  { value: 'dark', label: 'Escuro', description: 'Sempre usa o tema escuro.' },
  { value: 'system', label: 'Sistema', description: 'Segue a preferência do sistema operacional.' },
];

export default function UpdateThemeForm({ className = '' }) {
  const { auth } = usePage().props;

  const { data, setData, patch, processing, recentlySuccessful } = useForm({
    theme_preference: auth.user?.theme_preference ?? 'light',
  });

  const submit = (e) => {
    e.preventDefault();
    patch(route('profile.theme'), { preserveScroll: true });
  };

  return (
    <section className={className}>
      <header>
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Aparência</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Escolha o tema de exibição da interface.
        </p>
      </header>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <div className="space-y-3">
          {THEME_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                data.theme_preference === option.value
                  ? 'border-teal-600 bg-teal-50 dark:border-teal-500 dark:bg-teal-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="theme_preference"
                value={option.value}
                checked={data.theme_preference === option.value}
                onChange={() => setData('theme_preference', option.value)}
                className="mt-0.5 text-teal-600 focus:ring-teal-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{option.label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <PrimaryButton disabled={processing}>Salvar</PrimaryButton>

          <Transition
            show={recentlySuccessful}
            enter="transition ease-in-out"
            enterFrom="opacity-0"
            leave="transition ease-in-out"
            leaveTo="opacity-0"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">Salvo.</p>
          </Transition>
        </div>
      </form>
    </section>
  );
}
