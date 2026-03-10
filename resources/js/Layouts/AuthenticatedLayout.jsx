import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { useMemo, useRef, useState, useEffect } from 'react';

export default function AuthenticatedLayout({ header, children }) {
  const user = usePage().props.auth.user;
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // menu engrenagem
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);

  const isAdmin = user?.role === 'admin';

  const mainLinks = useMemo(() => {
    if (isAdmin) {
      return [
        {
          label: 'Painel',
          href: route('admin.dashboard'),
          active: route().current('admin.dashboard'),
          icon: 'dashboard',
        },
        {
          label: 'Horários',
          href: route('timeslots.index'),
          active: route().current('timeslots.*'),
          icon: 'calendar',
        },
        {
          label: 'Agenda',
          href: route('admin.agenda'),
          active: route().current('admin.agenda'),
          icon: 'schedule',
        },
        {
          label: 'Fretes',
          href: route('freights.approvalList'),
          active: route().current('freights.*'),
          icon: 'freight',
        },
        {
          label: 'Clientes',
          href: route('clients.index'),
          active: route().current('clients.*'),
          icon: 'users',
        },
        {
          label: 'Endereços',
          href: route('dropoff-addresses.index'),
          active: route().current('dropoff-addresses.*'),
          icon: 'location',
        },
      ];
    }

    return [
      {
        label: 'Painel',
        href: route('client.dashboard'),
        active: route().current('client.dashboard'),
        icon: 'dashboard',
      },
      {
        label: 'Horários Disponíveis',
        href: route('client.available'),
        active: route().current('client.available'),
        icon: 'calendar',
      },
      {
        label: 'Minhas Reservas',
        href: route('client.reservations'),
        active: route().current('client.reservations'),
        icon: 'clipboard',
      },
      {
        label: 'Caminhões',
        href: route('client.trucks'),
        active: route().current('client.trucks'),
        icon: 'truck',
      },
    ];
  }, [isAdmin]);

  const SideLink = ({ href, active, label, icon }) => (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
        active ? 'bg-teal-700 text-white' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon && <MenuIcon name={icon} className="h-4 w-4 shrink-0" />}
      <span>{label}</span>
    </Link>
  );

  // fecha menu ao clicar fora / esc
  useEffect(() => {
    const onClickOutside = (e) => {
      if (!showAccountMenu) return;
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setShowAccountMenu(false);
      }
    };

    const onEsc = (e) => {
      if (e.key === 'Escape') setShowAccountMenu(false);
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [showAccountMenu]);

  return (
    <div className="min-h-screen bg-gray-100 lg:flex">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden w-72 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <Link href={route('dashboard')}>
            <img src="/storage/logo.png" className="h-28 w-auto" alt="Logo" />
          </Link>

          <div className="mt-4">
            <p className="text-base font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{isAdmin ? 'Administrador' : 'Cliente'}</p>
          </div>
        </div>

        {/* Menu */}
        <div className="flex-1 space-y-6 p-6">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Menu</p>
            <div className="space-y-2">
              {mainLinks.map((link) => (
                <SideLink key={link.label} {...link} />
              ))}
            </div>
          </div>
        </div>

        {/* Engrenagem + dropdown (canto inferior esquerdo) */}
        <div className="relative border-t border-gray-200 p-4" ref={accountMenuRef}>
          <button
            type="button"
            onClick={() => setShowAccountMenu((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span className="flex items-center gap-2">
              <GearIcon className="h-5 w-5 text-gray-600" />
              Conta
            </span>
            <span className="text-gray-400">{showAccountMenu ? '▲' : '▼'}</span>
          </button>

          {showAccountMenu && (
            <div className="absolute bottom-14 left-4 right-4 rounded-lg border border-gray-200 bg-white shadow-lg">
              <Link
                href={route('profile.edit')}
                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowAccountMenu(false)}
              >
                Perfil
              </Link>

              <Link
                href={route('logout')}
                method="post"
                as="button"
                className="block w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-gray-50"
                onClick={() => setShowAccountMenu(false)}
              >
                Sair
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* CONTEÚDO */}
      <div className="min-w-0 flex-1">
        {/* Top bar mobile */}
        <div className="border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <Link href={route('dashboard')}>
              <ApplicationLogo className="h-8 w-auto fill-current text-gray-800" />
            </Link>
            <button
              type="button"
              onClick={() => setShowMobileMenu((state) => !state)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700"
            >
              Menu
            </button>
          </div>

          {showMobileMenu && (
            <div className="mt-3 space-y-2">
              {mainLinks.map((link) => (
                <SideLink key={link.label} {...link} />
              ))}
              <SideLink
                href={route('profile.edit')}
                active={route().current('profile.edit')}
                label="Perfil"
              />
              <Link
                href={route('logout')}
                method="post"
                as="button"
                className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Sair
              </Link>
            </div>
          )}
        </div>

        {header && (
          <header className="border-b border-gray-200 bg-white">
            <div className="px-4 py-6 sm:px-6 lg:px-8">{header}</div>
          </header>
        )}

        <main>{children}</main>
      </div>
    </div>
  );
}

function GearIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 13.1c.04-.36.06-.73.06-1.1 0-.37-.02-.74-.06-1.1l2-1.55a.7.7 0 0 0 .17-.9l-1.9-3.3a.7.7 0 0 0-.86-.3l-2.35.95a8.1 8.1 0 0 0-1.9-1.1l-.36-2.5A.7.7 0 0 0 13.5 1h-3a.7.7 0 0 0-.69.6l-.36 2.5c-.68.27-1.32.63-1.9 1.1l-2.35-.95a.7.7 0 0 0-.86.3l-1.9 3.3a.7.7 0 0 0 .17.9l2 1.55c-.04.36-.06.73-.06 1.1 0 .37.02.74.06 1.1l-2 1.55a.7.7 0 0 0-.17.9l1.9 3.3c.18.32.56.45.86.3l2.35-.95c.58.47 1.22.83 1.9 1.1l.36 2.5c.06.35.36.6.69.6h3c.35 0 .64-.25.69-.6l.36-2.5c.68-.27 1.32-.63 1.9-1.1l2.35.95c.3.15.68.02.86-.3l1.9-3.3a.7.7 0 0 0-.17-.9l-2-1.55Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({ name, className = '' }) {
  const objPaths = {
    dashboard:
      'M3 3h8v8H3V3Zm10 0h8v5h-8V3ZM13 10h8v11h-8V10ZM3 13h8v8H3v-8Z',
    calendar:
      'M7 2v3M17 2v3M3.5 8.5h17M6 5.5h12a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V8A2.5 2.5 0 0 1 6 5.5Z',
    schedule:
      'M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
    freight:
      'M3 6h11v8H3V6Zm11 3h3l3 3v2h-6V9ZM7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
    users:
      'M7.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm9 2a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 19.5a5 5 0 0 1 10 0M13 19.5a4 4 0 0 1 8 0',
    location:
      'M12 21s6-6.2 6-11a6 6 0 1 0-12 0c0 4.8 6 11 6 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    clipboard:
      'M9 4.5h6m-5-2h4a1 1 0 0 1 1 1v1H9v-1a1 1 0 0 1 1-1Zm-2 3h8a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2Z',
    truck:
      'M3 7h10v7H3V7Zm10 2h3l3 3v2h-6V9Zm-6 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  };

  const strPath = objPaths[name] || objPaths.dashboard;

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={strPath} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
