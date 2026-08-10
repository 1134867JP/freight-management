import BrandLogo from '@/Components/UI/BrandLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div
        className="fixed inset-y-0 left-0 right-[500px] hidden bg-cover bg-center lg:block"
        style={{ backgroundImage: "url('/bg-yard.jpg')" }}
      />
      <div className="fixed inset-y-0 left-0 right-[500px] hidden bg-[#081525]/90 lg:block" />

      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_500px]">
        <div className="hidden flex-col justify-between p-12 lg:flex xl:p-16">
          <div>
            <Link href="/" className="inline-flex" aria-label="CargoHub">
              <BrandLogo inverse />
            </Link>

            <div className="mt-24 max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">Yard Management System</p>
              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.035em] text-white xl:text-5xl">
                Gestão operacional do pátio
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
                Agendamentos, portaria, filas, docas e movimentações em uma única visão de trabalho.
              </p>

              <ul className="mt-9 max-w-lg divide-y divide-white/10 border-y border-white/10 text-sm text-slate-300">
                {['Controle de entrada e saída', 'Planejamento de docas e capacidade', 'Acompanhamento do fluxo operacional'].map((item) => (
                  <li key={item} className="flex items-center gap-3 py-3.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-xs text-slate-600">© 2026 CargoHub YMS. Todos os direitos reservados.</p>
        </div>

        <div className="flex items-center justify-center border-l border-slate-200 bg-slate-100 px-5 py-10 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <BrandLogo />
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-950/10 [&_input]:!border-slate-300 [&_input]:!bg-white [&_input]:!text-slate-900 [&_input]:!placeholder-slate-400 [&_label]:!text-slate-700">
              <div className="border-t-[3px] border-brand-700 px-6 py-8 sm:px-9 sm:py-9">
                {children}
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-slate-500">© 2026 CargoHub YMS</p>
          </div>
        </div>
      </div>
    </div>
  );
}
