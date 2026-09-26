import BrandLogo from '@/Components/UI/BrandLogo';
import { Link } from '@inertiajs/react';

const FLOW = ['Agendamento', 'Portaria', 'Pátio', 'Doca', 'Saída'];

export default function GuestLayout({ children }) {
  return (
    <div className="min-h-screen bg-concrete-100">
      <div
        className="fixed inset-y-0 left-0 right-[500px] hidden bg-cover bg-center grayscale lg:block"
        style={{ backgroundImage: "url('/bg-yard.jpg')" }}
      />
      <div className="fixed inset-y-0 left-0 right-[500px] hidden bg-ink/90 lg:block" />

      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_500px]">
        <div className="hidden flex-col justify-between p-12 lg:flex xl:p-16">
          <div>
            <Link href="/" className="inline-flex" aria-label="CargoHub">
              <BrandLogo inverse />
            </Link>

            <div className="mt-24 max-w-2xl">
              <p className="stencil text-sm text-signal-400">Yard Management System</p>
              <h1 className="mt-3 text-6xl font-extrabold leading-[0.95] text-white xl:text-7xl">
                Gestão operacional
                <br />
                do pátio
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-7 text-concrete-300">
                Agendamentos, portaria, filas, docas e movimentações em uma única visão de trabalho.
              </p>

              <ol className="mt-12 flex max-w-xl items-stretch border-2 border-white/20">
                {FLOW.map((step, index) => (
                  <li
                    key={step}
                    className="flex flex-1 flex-col gap-1 border-r-2 border-white/20 px-3 py-3 last:border-r-0"
                  >
                    <span className="font-mono text-xs text-signal-400">{String(index + 1).padStart(2, '0')}</span>
                    <span className="stencil text-sm text-white">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <p className="stencil text-xs text-concrete-500">© 2026 CargoHub YMS</p>
        </div>

        <div className="flex items-center justify-center border-l-2 border-ink bg-concrete-100 px-5 py-10 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <BrandLogo />
            </div>

            <div className="overflow-hidden border-2 border-ink bg-white shadow-plate [&_input]:!border-concrete-400 [&_input]:!bg-white [&_input]:!text-ink [&_input]:!placeholder-concrete-400 [&_label]:!text-concrete-700">
              <div className="hazard h-2.5" aria-hidden="true" />
              <div className="px-6 py-8 sm:px-9 sm:py-9">
                {children}
              </div>
            </div>

            <p className="stencil mt-6 text-center text-xs text-concrete-500">© 2026 CargoHub YMS</p>
          </div>
        </div>
      </div>
    </div>
  );
}
