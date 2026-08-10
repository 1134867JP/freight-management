import BrandLogo from '@/Components/UI/BrandLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06101e]">
      <div
        className="absolute inset-0 scale-[1.03] bg-cover bg-center"
        style={{ backgroundImage: "url('/bg-yard.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#06101e]/95 via-[#0b1b31]/85 to-[#06101e]/95" />
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] opacity-40 [background-size:36px_36px]" />

      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_500px]">
        <div className="hidden flex-col justify-between p-12 lg:flex xl:p-16">
          <div>
            <Link href="/" className="inline-flex" aria-label="CargoHub">
              <BrandLogo inverse />
            </Link>

            <div className="mt-20 max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-blue-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Gestão de pátio conectada
              </span>
              <h1 className="mt-6 text-5xl font-extrabold leading-[1.06] tracking-[-0.045em] text-white xl:text-6xl">
                Fluxo previsível.<br />
                Pátio <span className="text-blue-400">sob controle.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-300">
                Agendamentos, portaria, docas e transportadoras trabalham na mesma visão operacional.
              </p>

              <div className="mt-9 grid max-w-lg grid-cols-3 gap-3">
                {['Agendamento claro', 'Check-in rápido', 'Visão em tempo real'].map((item) => (
                  <div key={item} className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-3 text-xs font-semibold leading-relaxed text-slate-300 backdrop-blur-sm">
                    <span className="mb-2 block h-1.5 w-1.5 rounded-full bg-blue-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600">© 2026 CargoHub YMS. Todos os direitos reservados.</p>
        </div>

        <div className="relative flex items-center justify-center px-5 py-10 sm:px-8 lg:px-10">
          <div className="absolute inset-0 border-l border-white/[0.06] bg-slate-950/35 backdrop-blur-md" />

          <div className="relative w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <BrandLogo inverse />
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl shadow-slate-950/30 [&_input]:!border-slate-200 [&_input]:!bg-white [&_input]:!text-slate-900 [&_input]:!placeholder-slate-400 [&_label]:!text-slate-700">
              <div className="h-1 w-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400" />
              <div className="px-6 py-8 sm:px-9 sm:py-9">
                {children}
              </div>
            </div>

            <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs font-medium text-slate-500">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 8V6a5 5 0 0 1 10 0v2m-9 0h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.4" /></svg>
              Ambiente protegido e acesso seguro
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
