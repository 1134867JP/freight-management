import ApplicationLogo from '@/Components/ApplicationLogo';
import { useTheme } from '@/hooks/useTheme';
import { Link, usePage } from '@inertiajs/react';
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';

export default function AuthenticatedLayout({ header, children }) {
  useTheme();

  const { auth } = usePage().props;
  const user = auth.user;
  const company = auth.company;
  const permissions = auth.permissions;
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [openGroups, setOpenGroups] = useState({});

  // menu engrenagem
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);

  const isPlatformAdmin = user?.role === 'platform_admin';
  const isCompanyAdmin = user?.role === 'company_admin';
  const isCompanyEmployee = user?.role === 'company_employee';
  const isAdmin = isCompanyAdmin || isCompanyEmployee;
  const logoUrl = company?.logo_url || '/storage/logo.png';
  const usesQueues = company?.uses_queues ?? true;
  const usesDocks  = company?.uses_docks  ?? true;
  const roleLabel = isPlatformAdmin
    ? 'Super Admin'
    : isCompanyAdmin
      ? 'Administrador'
      : isCompanyEmployee
        ? 'Funcionário'
        : 'Cliente';

  const menuSections = useMemo(() => {
    if (isPlatformAdmin) {
      return [
        {
          section: null,
          items: [
            { label: 'Empresas', href: route('platform.dashboard'), active: route().current('platform.*'), icon: 'buildings' },
          ],
        },
      ];
    }

    if (isAdmin) {
      const yardStructureChildren = [
        ...(usesDocks   ? [{ label: 'Docas',             href: route('docas.index'),       active: route().current('docas.*')       }] : []),
        ...(usesQueues  ? [{ label: 'Zonas do Pátio',    href: route('yard-zones.index'),  active: route().current('yard-zones.*')  }] : []),
        ...(usesQueues  ? [{ label: 'Vagas do Pátio',    href: route('yard-spots.index'),  active: route().current('yard-spots.*')  }] : []),
        ...(usesQueues  ? [{ label: 'Cavalos Mecânicos', href: route('yard-trucks.index'), active: route().current('yard-trucks.*') }] : []),
      ];

      const cadastrosItems = [
        { label: 'Clientes',  href: route('clients.index'),           active: route().current('clients.*'),           icon: 'users'    },
        { label: 'Endereços', href: route('dropoff-addresses.index'),  active: route().current('dropoff-addresses.*'), icon: 'location' },
        { label: 'Produtos',  href: route('produtos.index'),           active: route().current('produtos.*'),          icon: 'box'      },
        ...(yardStructureChildren.length > 0 ? [{
          label: 'Estrutura do Pátio',
          icon: 'zones',
          group: 'yard-structure',
          active: route().current('docas.*') || route().current('yard-zones.*') || route().current('yard-spots.*') || route().current('yard-trucks.*'),
          children: yardStructureChildren,
        }] : []),
      ];

      return [
        {
          section: 'Operação',
          items: [
            { label: 'Painel',   href: route('admin.dashboard'),       active: route().current('admin.dashboard'), icon: 'dashboard' },
            ...((usesQueues || usesDocks) ? [{ label: 'Portaria', href: route('admin.gate'), active: route().current('admin.gate'), icon: 'gate' }] : []),
            { label: 'Fretes',   href: route('freights.approvalList'), active: route().current('freights.*'),      icon: 'freight'   },
          ],
        },
        ...(usesQueues ? [{
          section: 'Pátio',
          items: [
            { label: 'Painel do Pátio',        href: route('admin.yard-board'),  active: route().current('admin.yard-board'),   icon: 'yardboard' },
            { label: 'Mapa do Pátio',          href: route('admin.yard-map'),    active: route().current('admin.yard-map'),     icon: 'map'       },
            { label: 'Ordens de Movimentação', href: route('admin.move-orders'), active: route().current('admin.move-orders*'), icon: 'moveorder' },
            { label: 'KPIs',                   href: route('admin.kpi'),         active: route().current('admin.kpi'),          icon: 'kpi'       },
          ],
        }] : []),
        {
          section: 'Agendamento',
          items: [
            { label: 'Cotas',  href: route('timeslots.index'), active: route().current('timeslots.*'),  icon: 'calendar' },
            { label: 'Agenda', href: route('admin.agenda'),    active: route().current('admin.agenda'), icon: 'schedule' },
          ],
        },
        { section: 'Cadastros', items: cadastrosItems },
        {
          section: 'Dados',
          items: [
            {
              label: 'Relatórios',
              icon: 'chart',
              group: 'reports-admin',
              active: route().current('reports.admin.*'),
              children: [
                { label: 'Cotas',   href: route('reports.admin.timeslots'), active: route().current('reports.admin.timeslots') },
                { label: 'Fretes',  href: route('reports.admin.freights'),  active: route().current('reports.admin.freights')  },
              ],
            },
          ],
        },
        {
          section: 'Configurações',
          items: [
            {
              label: 'WhatsApp',
              href: route('admin.whatsapp'),
              active: route().current('admin.whatsapp*'),
              icon: 'whatsapp',
            },
          ],
        },
      ];
    }

    // Client
    return [
      {
        section: 'Operação',
        items: [
          { label: 'Painel', href: route('client.dashboard'), active: route().current('client.dashboard'), icon: 'dashboard' },
          { label: 'Cotas Disponíveis', href: route('client.available'), active: route().current('client.available'), icon: 'calendar' },
          { label: 'Minhas Reservas', href: route('client.reservations'), active: route().current('client.reservations'), icon: 'clipboard' },
          { label: 'Caminhões', href: route('client.trucks'), active: route().current('client.trucks'), icon: 'truck' },
          { label: 'Motoristas', href: route('client.drivers'), active: route().current('client.drivers'), icon: 'driver' },
        ],
      },
      {
        section: 'Dados',
        items: [
          {
            label: 'Relatórios',
            icon: 'chart',
            group: 'reports-client',
            active: route().current('reports.client.*'),
            children: [
              { label: 'Meus Fretes', href: route('reports.client.reservations'), active: route().current('reports.client.reservations') },
            ],
          },
        ],
      },
    ];
  }, [isAdmin, isPlatformAdmin, usesQueues, usesDocks]);

  const mainLinks = useMemo(
    () => menuSections.flatMap((s) =>
      s.items.flatMap((i) => i.children ? i.children : [i])
    ),
    [menuSections],
  );

  const SideLink = ({ href, active, label, icon }) => (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
        active
          ? 'border-l-2 border-brand-400 bg-brand-600/20 pl-2.5 font-semibold text-brand-300'
          : 'border-l-2 border-transparent font-medium text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      {icon && (
        <MenuIcon
          name={icon}
          className={`h-4 w-4 shrink-0 ${active ? 'text-brand-400' : 'text-gray-500'}`}
        />
      )}
      <span>{label}</span>
    </Link>
  );

  const SubLink = ({ href, active, label }) => (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition ${
        active
          ? 'font-medium text-brand-300'
          : 'text-gray-500 hover:text-gray-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? 'bg-brand-400' : 'bg-gray-600'}`} />
      {label}
    </Link>
  );

  const toggleGroup = useCallback((key) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const NavGroup = ({ item }) => {
    const isOpen = openGroups[item.group] !== undefined ? openGroups[item.group] : (item.active ?? false);
    return (
      <div>
        <button
          type="button"
          onClick={() => toggleGroup(item.group)}
          className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition ${
            item.active
              ? 'bg-brand-600/20 text-brand-300'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-2">
            {item.icon && <MenuIcon name={item.icon} className="h-4 w-4 shrink-0" />}
            {item.label}
          </span>
          <span className="text-xs text-gray-500">{isOpen ? '▲' : '▼'}</span>
        </button>
        {isOpen && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-700 pl-3">
            {item.children.map((child) => (
              <Link
                key={child.label}
                href={child.href}
                className={`block rounded-md px-3 py-2 text-sm transition ${
                  child.active
                    ? 'bg-brand-600 font-medium text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 lg:flex lg:h-screen lg:overflow-hidden">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden w-72 shrink-0 border-r border-gray-800 bg-gray-950 lg:flex lg:flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 p-5">
          <Link href={route('dashboard')}>
            {company?.logo_url ? (
              <img src={logoUrl} className="h-10 w-auto object-contain brightness-0 invert" alt={company.name || 'Logo'} />
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M3 7h10v7H3V7Zm10 2h3l3 3v2h-6V9Zm-6 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm font-bold tracking-tight text-white">CargoHub YMS</span>
              </div>
            )}
          </Link>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="text-xs text-gray-400">{roleLabel}</p>
              {company?.name && !isPlatformAdmin && (
                <p className="truncate text-xs text-gray-500">{company.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-5 overflow-y-auto p-4">
          {menuSections.map((objSection) => (
            <div key={objSection.section ?? '_main'}>
              {objSection.section && (
                <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
                  {objSection.section}
                </p>
              )}
              <div className="space-y-0.5">
                {objSection.items.map((item) => {
                  if (item.children) return <NavGroup key={item.label} item={item} />;
                  if (item.sub) return <SubLink key={item.label} {...item} />;
                  return <SideLink key={item.label} {...item} />;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Engrenagem + dropdown (canto inferior esquerdo) */}
        <div className="relative border-t border-gray-800 p-4" ref={accountMenuRef}>
          <button
            type="button"
            onClick={() => setShowAccountMenu((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <GearIcon className="h-5 w-5 text-gray-400" />
              Conta
            </span>
            <span className="text-gray-500">{showAccountMenu ? '▲' : '▼'}</span>
          </button>

          {showAccountMenu && (
            <div className="absolute bottom-14 left-4 right-4 rounded-lg border border-gray-700 bg-gray-900 shadow-xl">
              <Link
                href={route('profile.edit')}
                className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-t-lg transition-colors"
                onClick={() => setShowAccountMenu(false)}
              >
                Perfil
              </Link>

              {permissions?.manage_admins && (
                <Link
                  href={route('admins.index')}
                  className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  onClick={() => setShowAccountMenu(false)}
                >
                  Administradores
                </Link>
              )}

              {permissions?.manage_employees && (
                <Link
                  href={route('employees.index')}
                  className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  onClick={() => setShowAccountMenu(false)}
                >
                  Funcionários
                </Link>
              )}

              {permissions?.view_audit_logs && (
                <Link
                  href={route('audit-logs.index')}
                  className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  onClick={() => setShowAccountMenu(false)}
                >
                  Logs
                </Link>
              )}

              <Link
                href={route('logout')}
                method="post"
                as="button"
                className="block w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-gray-800 rounded-b-lg transition-colors"
                onClick={() => setShowAccountMenu(false)}
              >
                Sair
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* CONTEÚDO */}
      <div className="min-w-0 flex-1 lg:overflow-y-auto">
        {/* Top bar mobile */}
        <div className="border-b border-gray-800 bg-gray-950 px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <Link href={route('dashboard')} className="flex items-center gap-2 text-white">
              <ApplicationLogo className="h-8 w-auto fill-current text-white" />
              <span className="text-sm font-bold tracking-tight">CargoHub YMS</span>
            </Link>
            <button
              type="button"
              onClick={() => setShowMobileMenu((state) => !state)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 text-gray-200 transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-400"
              aria-label={showMobileMenu ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={showMobileMenu}
            >
              {showMobileMenu ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              )}
            </button>
          </div>

          {showMobileMenu && (
            <nav aria-label="Navegação principal" className="mt-3 space-y-1 border-t border-gray-800 pt-3">
              {mainLinks.map((link) => (
                <SideLink key={link.label} {...link} />
              ))}
              <div className="mt-2 border-t border-gray-800 pt-2">
                <Link
                  href={route('profile.edit')}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Perfil
                </Link>
                <Link
                  href={route('logout')}
                  method="post"
                  as="button"
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-950/30"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sair
                </Link>
              </div>
            </nav>
          )}
        </div>

        {header && (
          <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="px-6 py-5 sm:px-8">{header}</div>
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
    buildings:
      'M4 21V7a2 2 0 0 1 2-2h5v16M14 21V3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v18M8 9h2M8 13h2M8 17h2M16 7h2M16 11h2M16 15h2',
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
    chart:
      'M3 17l4-8 4 5 3-3 4 6M3 21h18',
    logs:
      'M9 12h6M9 16h4M7 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-5-4H7ZM13 4v4h4',
    box:
      'M21 8l-9-5-9 5v9l9 5 9-5V8ZM3 8l9 5 9-5M12 13v9',
    dock:
      'M2 20V9l10-6 10 6v11H2ZM9 20v-6h6v6',
    yardboard:
      'M3 3h7v7H3V3Zm0 11h7v7H3v-7Zm11-11h7v7h-7V3Zm0 11h7v7h-7v-7Z',
    gate:
      'M3 12h18M3 12V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 12v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M9 12v4m6-4v4',
    map:
      'M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3ZM9 3v15M15 6v15',
    moveorder:
      'M5 12h14M12 5l7 7-7 7',
    zones:
      'M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm13 4a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    spot:
      'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z',
    yardtruck:
      'M1 3h15v13H1V3Zm15 5 5 3v5h-5V8ZM5.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
    kpi:
      'M18 20V10M12 20V4M6 20v-6',
    driver:
      'M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 13a7 7 0 0 1 14 0',
    whatsapp:
      'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Z',
  };

  const strPath = objPaths[name] || objPaths.dashboard;

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={strPath} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
