import BrandLogo from '@/Components/UI/BrandLogo';
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

  const SideLink = ({ href, active, label, icon, onNavigate }) => (
    <Link
      href={href}
      onClick={onNavigate}
      className={`group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-150 ${
        active
          ? 'bg-white font-semibold text-slate-950 shadow-[0_5px_18px_rgba(2,6,23,0.22)]'
          : 'font-medium text-slate-400 hover:bg-white/[0.07] hover:text-white'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      {icon && (
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${active ? 'bg-brand-50 text-brand-600' : 'text-slate-500 group-hover:text-slate-200'}`}>
          <MenuIcon name={icon} className="h-4 w-4" />
        </span>
      )}
      <span className="truncate">{label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />}
    </Link>
  );

  const SubLink = ({ href, active, label, onNavigate }) => (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
        active
          ? 'bg-brand-500/15 font-semibold text-brand-200'
          : 'text-slate-500 hover:bg-white/[0.05] hover:text-slate-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? 'bg-brand-400' : 'bg-slate-700'}`} />
      {label}
    </Link>
  );

  const toggleGroup = useCallback((key) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const NavGroup = ({ item, onNavigate }) => {
    const isOpen = openGroups[item.group] !== undefined ? openGroups[item.group] : (item.active ?? false);
    return (
      <div>
        <button
          type="button"
          onClick={() => toggleGroup(item.group)}
          className={`flex min-h-10 w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
            item.active
              ? 'bg-brand-500/15 text-brand-200'
              : 'text-slate-400 hover:bg-white/[0.07] hover:text-white'
          }`}
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-3">
            {item.icon && (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500">
                <MenuIcon name={item.icon} className="h-4 w-4 shrink-0" />
              </span>
            )}
            {item.label}
          </span>
          <svg className={`h-4 w-4 text-slate-600 transition ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {isOpen && (
          <div className="ml-5 mt-1 space-y-1 border-l border-slate-800 pl-3">
            {item.children.map((child) => (
              <Link
                key={child.label}
                href={child.href}
                onClick={onNavigate}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  child.active
                    ? 'bg-brand-500/15 font-semibold text-brand-200'
                    : 'text-slate-500 hover:bg-white/[0.05] hover:text-white'
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

  const NavigationContent = ({ onNavigate = undefined }) => (
    <nav aria-label="Navegação principal" className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
      {menuSections.map((objSection) => (
        <div key={objSection.section ?? '_main'}>
          {objSection.section && (
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
              {objSection.section}
            </p>
          )}
          <div className="space-y-1">
            {objSection.items.map((item) => {
              if (item.children) return <NavGroup key={item.label} item={item} onNavigate={onNavigate} />;
              if (item.sub) return <SubLink key={item.label} {...item} onNavigate={onNavigate} />;
              return <SideLink key={item.label} {...item} onNavigate={onNavigate} />;
            })}
          </div>
        </div>
      ))}
    </nav>
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
      if (e.key === 'Escape') {
        setShowAccountMenu(false);
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [showAccountMenu]);

  useEffect(() => {
    if (!showMobileMenu) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [showMobileMenu]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 lg:flex lg:h-screen lg:overflow-hidden">
      <aside className="relative hidden w-[280px] shrink-0 overflow-hidden border-r border-slate-800/80 bg-[#07111f] lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="relative border-b border-white/[0.06] px-5 py-5">
          <Link href={route('dashboard')} aria-label="Ir para o painel">
            <BrandLogo inverse />
          </Link>

          {company?.name && !isPlatformAdmin && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] p-3">
              {company?.logo_url ? (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
                  <img src={logoUrl} className="max-h-full max-w-full object-contain" alt="" />
                </span>
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-xs font-bold text-brand-300">
                  {company.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">Ambiente</span>
                <span className="block truncate text-sm font-semibold text-slate-200">{company.name}</span>
              </span>
            </div>
          )}
        </div>

        <NavigationContent />

        <div className="relative border-t border-white/[0.06] p-4" ref={accountMenuRef}>
          <button
            type="button"
            onClick={() => setShowAccountMenu((v) => !v)}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.06]"
            aria-expanded={showAccountMenu}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-blue-950/30">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
              <span className="block text-xs text-slate-500">{roleLabel}</span>
            </span>
            <GearIcon className="h-4 w-4 text-slate-600" />
          </button>

          {showAccountMenu && (
            <div className="absolute bottom-[72px] left-4 right-4 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl shadow-black/40">
              <Link
                href={route('profile.edit')}
                className="block rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                onClick={() => setShowAccountMenu(false)}
              >
                Perfil
              </Link>

              {permissions?.manage_admins && (
                <Link
                  href={route('admins.index')}
                  className="block rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                  onClick={() => setShowAccountMenu(false)}
                >
                  Administradores
                </Link>
              )}

              {permissions?.manage_employees && (
                <Link
                  href={route('employees.index')}
                  className="block rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                  onClick={() => setShowAccountMenu(false)}
                >
                  Funcionários
                </Link>
              )}

              {permissions?.view_audit_logs && (
                <Link
                  href={route('audit-logs.index')}
                  className="block rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                  onClick={() => setShowAccountMenu(false)}
                >
                  Logs
                </Link>
              )}

              <Link
                href={route('logout')}
                method="post"
                as="button"
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-rose-400 transition hover:bg-rose-500/10"
                onClick={() => setShowAccountMenu(false)}
              >
                Sair
              </Link>
            </div>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:overflow-y-auto">
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-950/85">
          <Link href={route('dashboard')} className="lg:hidden" aria-label="Ir para o painel">
            <BrandLogo compact />
          </Link>

          <div className="hidden min-w-0 lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Central de operações</p>
            <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{company?.name || 'CargoHub YMS'}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Sistema operacional
            </span>
            <button
              type="button"
              onClick={() => setShowMobileMenu((state) => !state)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
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
        </div>

        {showMobileMenu && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} aria-label="Fechar menu" />
            <aside className="relative flex h-full w-[min(88vw,340px)] flex-col bg-[#07111f] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">
                <BrandLogo inverse />
                <button type="button" onClick={() => setShowMobileMenu(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Fechar menu">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </div>
              <NavigationContent onNavigate={() => setShowMobileMenu(false)} />
              <div className="border-t border-white/[0.06] p-4">
                <div className="mb-3 flex items-center gap-3 px-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                  <span className="min-w-0"><span className="block truncate text-sm font-semibold text-white">{user.name}</span><span className="block text-xs text-slate-500">{roleLabel}</span></span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link href={route('profile.edit')} onClick={() => setShowMobileMenu(false)} className="rounded-lg bg-white/[0.06] px-3 py-2 text-center text-sm font-medium text-slate-300">Perfil</Link>
                  <Link href={route('logout')} method="post" as="button" onClick={() => setShowMobileMenu(false)} className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-300">Sair</Link>
                </div>
              </div>
            </aside>
          </div>
        )}

        {header && (
          <header className="border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">{header}</div>
          </header>
        )}

        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
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
