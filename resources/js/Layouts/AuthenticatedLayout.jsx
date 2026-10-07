import { useTheme } from '@/hooks/useTheme';
import { Link, usePage } from '@inertiajs/react';
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';

const SIDEBAR_STORAGE_KEY = 'cargohub.sidebar.collapsed';
const NAV_MORE_STORAGE_KEY = 'cargohub.nav.more';

function readStoredFlag(key) {
  try {
    return window.localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function writeStoredFlag(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // armazenamento indisponível: o menu continua funcionando sem lembrar.
  }
}

export default function AuthenticatedLayout({ header, children }) {
  useTheme();

  const { auth } = usePage().props;
  const user = auth.user;
  const company = auth.company;
  const permissions = auth.permissions;
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  // Grupos recolhidos por padrão; só "Mais ferramentas" lembra que ficou aberto.
  const [openGroups, setOpenGroups] = useState(() => {
    if (typeof window === 'undefined') return {};
    return readStoredFlag(NAV_MORE_STORAGE_KEY) ? { more: true, 'client-more': true } : {};
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  });

  // menu engrenagem
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);

  const isPlatformAdmin = user?.role === 'platform_admin';
  const isCompanyAdmin = user?.role === 'company_admin';
  const isCompanyEmployee = user?.role === 'company_employee';
  const isAdmin = isCompanyAdmin || isCompanyEmployee;
  const logoUrl = company?.logo_url;
  const usesQueues = company?.uses_queues ?? true;
  const usesDocks  = company?.uses_docks  ?? true;
  const pilotMode = company?.pilot_mode ?? false;
  const canManageAdmins = permissions?.manage_admins ?? false;
  const canManageEmployees = permissions?.manage_employees ?? false;
  const canViewAuditLogs = permissions?.view_audit_logs ?? false;
  const canManageWhatsApp = permissions?.manage_whatsapp ?? false;
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
      // Menu mínimo: o que exige atenção, cotas, agendamentos e portaria.
      // O resto fica recolhido em "Mais ferramentas" e "Configurações".
      const showGate = !pilotMode && (usesQueues || usesDocks);

      const primaryItems = [
        { label: 'Início', href: route('admin.dashboard'), active: route().current('admin.dashboard'), icon: 'dashboard' },
        { label: 'Cotas', href: route('admin.quotas.index'), active: route().current('admin.quotas.*'), icon: 'quota' },
        { label: 'Agendamentos', href: route('admin.bookings.index'), active: route().current('admin.bookings.*'), icon: 'clipboard' },
        ...(showGate ? [{ label: 'Portaria', href: route('admin.gate'), active: route().current('admin.gate'), icon: 'gate' }] : []),
        ...(isCompanyAdmin ? [{ cta: true, label: 'Publicar cotas', href: route('admin.quotas.create'), active: route().current('admin.quotas.create') }] : []),
      ];

      const moreChildren = pilotMode
        ? [
            { label: 'Agenda', href: route('admin.agenda'), active: route().current('admin.agenda') },
            { label: 'Fretes', href: route('freights.approvalList'), active: route().current('freights.*') },
            { label: 'Horários avulsos', href: route('timeslots.index'), active: route().current('timeslots.*') },
          ]
        : [
            { label: 'Agenda', href: route('admin.agenda'), active: route().current('admin.agenda') },
            { label: 'Fretes', href: route('freights.approvalList'), active: route().current('freights.*') },
            { label: 'Horários avulsos', href: route('timeslots.index'), active: route().current('timeslots.*') },
            ...(usesQueues ? [
              { label: 'Visão operacional', href: route('admin.yard-board'), active: route().current('admin.yard-board') },
              { label: 'Mapa do pátio', href: route('admin.yard-map'), active: route().current('admin.yard-map') },
              { label: 'Movimentações', href: route('admin.move-orders'), active: route().current('admin.move-orders*') },
            ] : []),
            { label: 'Indicadores', href: route('admin.kpi'), active: route().current('admin.kpi') },
            { label: 'Relatório de horários', href: route('reports.admin.timeslots'), active: route().current('reports.admin.timeslots') },
            { label: 'Relatório de fretes', href: route('reports.admin.freights'), active: route().current('reports.admin.freights') },
          ];

      const settingsChildren = [
        { label: 'Clientes', href: route('clients.index'), active: route().current('clients.*') },
        { label: 'Destinos', href: route('dropoff-addresses.index'), active: route().current('dropoff-addresses.*') },
        ...(pilotMode ? [] : [
          { label: 'Produtos', href: route('produtos.index'), active: route().current('produtos.*') },
          ...(usesDocks ? [{ label: 'Docas', href: route('docas.index'), active: route().current('docas.*') }] : []),
          ...(usesQueues ? [
            { label: 'Zonas do Pátio', href: route('yard-zones.index'), active: route().current('yard-zones.*') },
            { label: 'Vagas do Pátio', href: route('yard-spots.index'), active: route().current('yard-spots.*') },
            { label: 'Veículos do Pátio', href: route('yard-trucks.index'), active: route().current('yard-trucks.*') },
          ] : []),
        ]),
        ...(canManageAdmins ? [{ label: 'Administradores', href: route('admins.index'), active: route().current('admins.*') }] : []),
        ...(canManageEmployees ? [{ label: 'Funcionários', href: route('employees.index'), active: route().current('employees.*') }] : []),
        ...(!pilotMode && canViewAuditLogs ? [{ label: 'Logs de auditoria', href: route('audit-logs.index'), active: route().current('audit-logs.*') }] : []),
        ...(canManageWhatsApp ? [{ label: 'WhatsApp', href: route('admin.whatsapp'), active: route().current('admin.whatsapp*') }] : []),
      ];

      return [
        { section: null, items: primaryItems },
        {
          section: null,
          divider: true,
          items: [
            {
              label: 'Mais ferramentas',
              icon: 'yardboard',
              group: 'more',
              persist: NAV_MORE_STORAGE_KEY,
              active: moreChildren.some((item) => item.active),
              children: moreChildren,
            },
            {
              label: 'Configurações',
              icon: 'sliders',
              group: 'settings',
              active: settingsChildren.some((item) => item.active),
              children: settingsChildren,
            },
          ],
        },
      ];
    }

    // Portal do cliente: o que tenho, o que agendei, o que preciso fazer.
    const clientCoreItems = [
      { label: 'Início', href: route('client.dashboard'), active: route().current('client.dashboard'), icon: 'dashboard' },
      { label: 'Cotas disponíveis', href: route('client.quotas'), active: route().current('client.quotas*'), icon: 'quota' },
      { label: 'Meus agendamentos', href: route('client.bookings'), active: route().current('client.bookings*'), icon: 'clipboard' },
    ];

    const clientMoreChildren = [
      { label: 'Horários avulsos', href: route('client.available'), active: route().current('client.available') },
      ...(pilotMode ? [] : [
        { label: 'Caminhões', href: route('client.trucks'), active: route().current('client.trucks') },
        { label: 'Motoristas', href: route('client.drivers'), active: route().current('client.drivers') },
        { label: 'Histórico de fretes', href: route('reports.client.reservations'), active: route().current('reports.client.*') },
      ]),
    ];

    return [
      { section: null, items: clientCoreItems },
      {
        section: null,
        divider: true,
        items: [
          {
            label: 'Mais',
            icon: 'yardboard',
            group: 'client-more',
            persist: NAV_MORE_STORAGE_KEY,
            active: clientMoreChildren.some((item) => item.active),
            children: clientMoreChildren,
          },
        ],
      },
    ];
  }, [canManageAdmins, canManageEmployees, canManageWhatsApp, canViewAuditLogs, isAdmin, isCompanyAdmin, isPlatformAdmin, pilotMode, usesQueues, usesDocks]);

  const SideLink = ({ href, active, label, icon, onNavigate, compact = false }) => (
    <Link
      href={href}
      onClick={onNavigate}
      className={`group relative flex min-h-11 items-center rounded-lg py-2 text-[15px] transition-colors duration-150 ${compact ? 'justify-center px-2' : 'gap-3 px-3'} ${
        active
          ? 'bg-white/85 font-semibold text-areia-900 shadow-[0_1px_2px_rgba(37,35,32,0.06),0_6px_16px_-10px_rgba(37,35,32,0.25)] dark:bg-white/10 dark:text-white dark:shadow-none'
          : 'font-medium text-areia-600 hover:bg-white/55 hover:text-areia-900 dark:text-areia-400 dark:hover:bg-white/[0.05] dark:hover:text-white'
      }`}
      aria-current={active ? 'page' : undefined}
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
    >
      {icon && (
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${active ? 'text-pinho-700 dark:text-ocre-300' : 'text-areia-500 group-hover:text-areia-800 dark:text-areia-500 dark:group-hover:text-areia-200'}`}>
          <MenuIcon name={icon} className="h-5 w-5" />
        </span>
      )}
      {!compact && <span className="truncate">{label}</span>}
    </Link>
  );

  const setGroupOpen = useCallback((item, value) => {
    setOpenGroups((prev) => ({ ...prev, [item.group]: value }));
    if (item.persist) writeStoredFlag(item.persist, value);
  }, []);

  const PublishLink = ({ href, label, onNavigate, compact = false }) => (
    <Link
      href={href}
      onClick={onNavigate}
      className={
        compact
          ? 'mx-auto my-1 flex h-11 w-11 items-center justify-center rounded-full bg-pinho-700 text-white shadow-sm transition-colors hover:bg-pinho-800'
          : 'mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-pinho-700 px-4 py-2 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-pinho-800'
      }
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
    >
      <MenuIcon name="plus" className="h-5 w-5 shrink-0" />
      {!compact && <span>{label}</span>}
    </Link>
  );

  const NavGroup = ({ item, onNavigate, compact = false }) => {
    const isOpen = openGroups[item.group] !== undefined ? openGroups[item.group] : (item.active ?? false);
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            if (compact) {
              setSidebarCollapsed(false);
              setGroupOpen(item, true);
              return;
            }
            setGroupOpen(item, !isOpen);
          }}
          className={`flex min-h-11 w-full items-center rounded-lg py-2 text-[15px] font-medium transition-colors ${compact ? 'justify-center px-2' : 'justify-between px-3'} ${
            item.active ? 'text-areia-900 dark:text-white' : 'text-areia-600 hover:bg-white/55 hover:text-areia-900 dark:text-areia-400 dark:hover:bg-white/[0.05] dark:hover:text-white'
          }`}
          aria-expanded={isOpen}
          aria-label={compact ? item.label : undefined}
          title={compact ? item.label : undefined}
        >
          <span className="flex items-center gap-3">
            {item.icon && (
              <span className={`flex h-6 w-6 items-center justify-center ${item.active ? 'text-pinho-700 dark:text-ocre-300' : 'text-areia-500'}`}>
                <MenuIcon name={item.icon} className="h-5 w-5 shrink-0" />
              </span>
            )}
            {!compact && item.label}
          </span>
          {!compact && (
            <svg className={`h-4 w-4 text-areia-400 transition ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        {isOpen && !compact && (
          <div className="ml-[23px] mt-1 space-y-0.5 border-l border-areia-300/60 pl-3 dark:border-white/10">
            {item.children.map((child) => (
              <Link
                key={child.label}
                href={child.href}
                onClick={onNavigate}
                className={`flex min-h-10 items-center rounded-lg px-3 py-2 text-[15px] transition ${
                  child.active
                    ? 'bg-white/85 font-semibold text-areia-900 shadow-sm dark:bg-white/10 dark:text-white'
                    : 'text-areia-600 hover:bg-white/55 hover:text-areia-900 dark:text-areia-400 dark:hover:bg-white/[0.05] dark:hover:text-white'
                }`}
                aria-current={child.active ? 'page' : undefined}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const NavigationContent = ({ onNavigate = undefined, compact = false }) => (
    <nav aria-label="Navegação principal" className={`flex-1 overflow-y-auto py-4 [scrollbar-width:thin] ${compact ? 'space-y-2 px-3' : 'space-y-3 px-3'}`}>
      {menuSections.map((objSection, index) => (
        <div
          key={objSection.section ?? `_section-${index}`}
          className={(compact ? index > 0 : objSection.divider) ? `border-t border-areia-300/50 dark:border-white/10 ${compact ? 'pt-2' : 'pt-3'}` : ''}
        >
          {objSection.section && !compact && (
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-areia-500/80 dark:text-areia-500">
              {objSection.section}
            </p>
          )}
          <div className="space-y-0.5">
            {objSection.items.map((item) => {
              if (item.children) return <NavGroup key={item.label} item={item} onNavigate={onNavigate} compact={compact} />;
              if (item.cta) return <PublishLink key={item.label} {...item} onNavigate={onNavigate} compact={compact} />;
              return <SideLink key={item.label} {...item} onNavigate={onNavigate} compact={compact} />;
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const CompanyChip = ({ compact = false }) => (
    company?.name && !isPlatformAdmin ? (
      <div className={`flex min-w-0 items-center ${compact ? 'justify-center' : 'gap-3'}`} title={compact ? company.name : undefined}>
        {logoUrl ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/90 p-1.5 shadow-sm">
            <img src={logoUrl} className="max-h-full max-w-full object-contain" alt="" />
          </span>
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pinho-600 to-pinho-800 font-display text-base font-bold text-white shadow-sm">
            {company.name.charAt(0).toUpperCase()}
          </span>
        )}
        {!compact && (
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold leading-tight text-areia-900 dark:text-white">{company.name}</span>
            <span className="block text-[13px] text-areia-500">{isAdmin ? 'Operação' : 'Portal do cliente'}</span>
          </span>
        )}
      </div>
    ) : (
      <span className={`block font-display text-lg font-bold text-areia-900 dark:text-white ${compact ? 'text-center' : ''}`}>{compact ? '·' : 'Plataforma'}</span>
    )
  );

  const Avatar = () => (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-areia-900 font-display text-base font-bold text-white ring-2 ring-white/70 dark:bg-white/15 dark:ring-white/10">
      {user.name.charAt(0).toUpperCase()}
    </span>
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

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const collapseButton = (
    <button
      type="button"
      onClick={() => setSidebarCollapsed((value) => !value)}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-areia-500 transition-colors hover:bg-white/60 hover:text-areia-900 dark:hover:bg-white/[0.06] dark:hover:text-white"
      aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
      title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <path d={sidebarCollapsed ? 'M9 4.5v15M13 10l2 2-2 2' : 'M9 4.5v15M15.5 10l-2 2 2 2'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  return (
    <div className="relative isolate min-h-screen text-areia-900 dark:text-areia-100 lg:flex lg:h-screen lg:overflow-hidden">
      {/* Fundo: luz suave nas cores da marca, base para o vidro. */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#F1ECE2] dark:bg-[#121512]" aria-hidden="true">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-pinho-300/45 blur-[110px] dark:bg-pinho-700/25" />
        <div className="absolute -right-32 top-1/3 h-[30rem] w-[30rem] rounded-full bg-ocre-200/55 blur-[120px] dark:bg-ocre-700/15" />
        <div className="absolute bottom-[-12rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-aco-200/40 blur-[110px] dark:bg-aco-800/20" />
      </div>

      <aside className={`glass relative m-3 mr-0 hidden shrink-0 flex-col rounded-3xl transition-[width] duration-200 lg:flex ${sidebarCollapsed ? 'w-[76px]' : 'w-[256px]'}`}>
        <div className={`flex items-center pb-2 pt-4 ${sidebarCollapsed ? 'flex-col gap-3 px-3' : 'justify-between gap-2 pl-4 pr-3'}`}>
          <CompanyChip compact={sidebarCollapsed} />
          {collapseButton}
        </div>

        <NavigationContent compact={sidebarCollapsed} />

        <div className="relative border-t border-white/60 p-3 dark:border-white/5" ref={accountMenuRef}>
          <button
            type="button"
            onClick={() => setShowAccountMenu((v) => !v)}
            className={`flex min-h-12 w-full items-center rounded-xl p-2 text-left transition-colors hover:bg-white/60 dark:hover:bg-white/[0.06] ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}
            aria-expanded={showAccountMenu}
            aria-label={sidebarCollapsed ? `Abrir menu de ${user.name}` : undefined}
          >
            <Avatar />
            {!sidebarCollapsed && <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-areia-900 dark:text-white">{user.name}</span>
              <span className="block text-[13px] text-areia-500">{roleLabel}</span>
            </span>}
            {!sidebarCollapsed && <GearIcon className="h-5 w-5 text-areia-400" />}
          </button>

          {showAccountMenu && (
            <div className={`glass-strong overflow-hidden rounded-xl p-1.5 ${sidebarCollapsed ? 'fixed bottom-4 left-[96px] z-50 w-56' : 'absolute bottom-[72px] left-3 right-3'}`}>
              <Link
                href={route('profile.edit')}
                className="block rounded-lg px-3 py-2.5 text-[15px] text-areia-800 transition hover:bg-white dark:text-areia-200 dark:hover:bg-white/10"
                onClick={() => setShowAccountMenu(false)}
              >
                Perfil
              </Link>

              <Link
                href={route('logout')}
                method="post"
                as="button"
                className="block w-full rounded-lg px-3 py-2.5 text-left text-[15px] text-tijolo-700 transition hover:bg-tijolo-50 dark:text-tijolo-300 dark:hover:bg-tijolo-950/40"
                onClick={() => setShowAccountMenu(false)}
              >
                Sair
              </Link>
            </div>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:overflow-y-auto">
        <div className="sticky top-0 z-30 px-3 pt-3 lg:hidden">
          <div className="glass flex h-14 items-center justify-between rounded-2xl pl-3 pr-1.5">
            <CompanyChip />
            <button
              type="button"
              onClick={() => setShowMobileMenu((state) => !state)}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-areia-700 transition-colors hover:bg-white/60 dark:text-areia-200 dark:hover:bg-white/10"
              aria-label={showMobileMenu ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={showMobileMenu}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M4 12h16M4 17h16"/>
              </svg>
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 bg-areia-950/30 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} aria-label="Fechar menu" />
            <aside className="glass-strong relative m-3 flex h-[calc(100%-1.5rem)] w-[min(86vw,320px)] flex-col rounded-3xl">
              <div className="flex items-center justify-between gap-2 py-4 pl-4 pr-2">
                <CompanyChip />
                <button type="button" onClick={() => setShowMobileMenu(false)} className="flex h-11 w-11 items-center justify-center rounded-xl text-areia-600 hover:bg-white/60 hover:text-areia-900 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Fechar menu">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </div>
              <NavigationContent onNavigate={() => setShowMobileMenu(false)} />
              <div className="border-t border-white/60 p-4 dark:border-white/5">
                <div className="mb-3 flex items-center gap-3 px-1">
                  <Avatar />
                  <span className="min-w-0"><span className="block truncate text-[15px] font-semibold">{user.name}</span><span className="block text-[13px] text-areia-500">{roleLabel}</span></span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link href={route('profile.edit')} onClick={() => setShowMobileMenu(false)} className="flex min-h-11 items-center justify-center rounded-xl bg-white/80 px-3 py-2 text-[15px] font-medium text-areia-800 shadow-sm dark:bg-white/10 dark:text-areia-100">Perfil</Link>
                  <Link href={route('logout')} method="post" as="button" onClick={() => setShowMobileMenu(false)} className="flex min-h-11 items-center justify-center rounded-xl bg-tijolo-50/80 px-3 py-2 text-[15px] font-medium text-tijolo-700 dark:bg-tijolo-500/15 dark:text-tijolo-200">Sair</Link>
                </div>
              </div>
            </aside>
          </div>
        )}

        {header && (
          <header className="glass mx-3 mt-3 rounded-2xl">
            <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">{header}</div>
          </header>
        )}

        <main className="min-h-[calc(100vh-4rem)] lg:min-h-screen lg:pt-3">{children}</main>
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
    plus:
      'M12 5v14M5 12h14',
    sliders:
      'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
    quota:
      'M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9ZM4 7.5l8 4.5 8-4.5M12 12v9M8 5.25l8 4.5',
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
