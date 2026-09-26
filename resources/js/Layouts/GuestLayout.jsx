import BrandLogo from '@/Components/UI/BrandLogo';
import { Link } from '@inertiajs/react';

const FLOW = ['Agendamento', 'Portaria', 'Pátio e doca', 'Saída'];

export default function GuestLayout({ children }) {
  return (
    <div className="min-h-screen bg-areia-100">
      <div className="mx-auto grid min-h-screen max-w-[1320px] grid-cols-1 gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_480px] lg:items-center lg:gap-16 lg:py-12">
        <div className="hidden lg:block">
          <Link href="/" className="inline-flex" aria-label="CargoHub">
            <BrandLogo />
          </Link>

          <p className="mt-12 max-w-xl font-display text-[44px] font-bold leading-[1.1] tracking-[-0.015em] text-areia-900">
            Seu pátio organizado, do agendamento à saída.
          </p>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-areia-600">
            Portaria, filas, docas e movimentações em um só lugar, com a mesma informação para
            toda a equipe.
          </p>

          <figure className="mt-10 overflow-hidden rounded-2xl border border-areia-200 bg-white shadow-sm">
            {/* A foto original tem uma arte gráfica à direita; o recorte mostra só o pátio. */}
            <div className="aspect-[16/7] overflow-hidden">
              <img src="/bg-yard.jpg" alt="Pátio com caminhões aguardando" className="h-full w-[142%] max-w-none object-cover object-left" />
            </div>
            <figcaption className="flex flex-wrap items-center gap-x-2 gap-y-1 px-5 py-4 text-[15px] font-medium text-areia-700">
              {FLOW.map((step, index) => (
                <span key={step} className="flex items-center gap-2">
                  {index > 0 && <span className="text-areia-400" aria-hidden="true">→</span>}
                  {step}
                </span>
              ))}
            </figcaption>
          </figure>
        </div>

        <div className="w-full">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLogo />
          </div>

          <div className="rounded-2xl border border-areia-200 bg-white px-6 py-8 shadow-lg sm:px-10 sm:py-10 [&_input]:!border-areia-400/70 [&_input]:!bg-white [&_input]:!text-areia-900 [&_input]:!placeholder-areia-400 [&_label]:!text-areia-800">
            {children}
          </div>

          <p className="mt-6 text-center text-sm text-areia-500">© 2026 CargoHub</p>
        </div>
      </div>
    </div>
  );
}
