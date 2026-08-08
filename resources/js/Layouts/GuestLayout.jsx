import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Fundo */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-[1.03]"
        style={{ backgroundImage: "url('/bg-yard.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-950/60 to-slate-950/85" />
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_480px]">

        {/* ── Painel esquerdo ── */}
        <div className="hidden lg:flex flex-col justify-between p-12">
          <div>
            {/* Logo texto para fundo escuro */}
            <Link href="/" className="inline-flex items-center gap-3">
              <CargoHubLogo dark />
            </Link>

            <div className="mt-16 max-w-md">
              <p className="text-4xl font-bold leading-tight text-white tracking-tight">
                Organização,<br />
                visibilidade<br />
                <span className="text-blue-400">e controle.</span>
              </p>
              <p className="mt-5 text-base text-white/65 leading-relaxed">
                Centralize Cotas, reservas e aprovações em um só lugar,
                com visibilidade total da operação de pátio.
              </p>
            </div>
          </div>

          <p className="text-xs text-white/35">© 2025 CargoHub YMS. Todos os direitos reservados.</p>
        </div>

        {/* ── Painel direito (formulário) ── */}
        <div className="relative flex items-center justify-center px-6 py-12 lg:px-10">
          <div className="absolute inset-0 backdrop-blur-sm bg-slate-950/40 lg:border-l lg:border-white/5" />

          <div className="relative w-full max-w-sm">

            {/* Logo mobile (acima do card) */}
            <div className="mb-8 lg:hidden flex justify-center">
              <CargoHubLogo dark />
            </div>

            {/* Card */}
            <div className="rounded-2xl bg-white shadow-2xl overflow-hidden [&_input]:!bg-white [&_input]:!text-gray-900 [&_input]:!border-gray-300 [&_input]:!placeholder-gray-400 [&_label]:!text-gray-700">

              {/* Barra de cor no topo */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />

              <div className="px-8 pt-8 pb-9">
                {/* Logo dentro do card */}
                <div className="mb-8 flex justify-center">
                  <img
                    src="/cargohub-logo.png"
                    alt="CargoHub YMS"
                    className="h-20 w-auto"
                  />
                </div>

                {children}
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-white/40">
              Acesso seguro
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function CargoHubLogo({ dark }) {
  return (
    <div className="flex items-center gap-3">
      {/* Ícone SVG */}
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" stroke={dark ? 'rgba(255,255,255,0.15)' : '#e2e8f0'} strokeWidth="1.5" />
        <path d="M20 8C14.477 8 10 12.477 10 18c0 7 10 16 10 16s10-9 10-16c0-5.523-4.477-10-10-10z" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="1.5" />
        <rect x="15" y="14" width="10" height="8" rx="1" fill={dark ? 'white' : '#1e293b'} />
        <path d="M15 17h10M18 14v8" stroke="#3b82f6" strokeWidth="1" />
        <path d="M7 20a1 1 0 0 1 2 0" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M31 20a1 1 0 0 1 2 0" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* Texto */}
      <div>
        <div className="flex items-baseline gap-0.5 leading-none">
          <span className={`text-xl font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-800'}`}>
            cargo
          </span>
          <span className="text-xl font-bold tracking-tight text-blue-500">hub</span>
        </div>
        <div className={`text-[10px] font-semibold tracking-[0.2em] uppercase mt-0.5 ${dark ? 'text-white/50' : 'text-slate-400'}`}>
          YMS
        </div>
      </div>
    </div>
  );
}
