import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* IMAGEM NO FUNDO TODO */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-[1.03]"
        style={{ backgroundImage: "url('/bg-yard.jpg')" }}
      />

      {/* Overlay geral para dar contraste */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-950/55 to-slate-950/80" />

      {/* “Glow” suave */}
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

      {/* Grid pattern discreto */}
      <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />

      {/* CONTEÚDO */}
      <div className="relative min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Lado visual */}
        <div className="hidden lg:flex flex-col justify-between p-10">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div>
                <div className="text-white font-semibold text-lg leading-tight">
                  Gerenciador de Pátio
                </div>
                <div className="text-white/70 text-sm">
                  Agendamento e controle de cargas e descargas
                </div>
              </div>
            </Link>

            <div className="mt-12 max-w-lg">
              <p className="text-3xl font-semibold leading-tight text-white">
                Organização, visibilidade <span className="text-white/80">e</span> controle.
              </p>
              <p className="mt-4 text-base text-white/75 leading-relaxed">
                Centralize horários, reservas e aprovações em um só lugar, com uma visão clara da
                operação.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-3">
                <Feature title="Agenda por horários" desc="Visualização por dia e ocupação." />
                <Feature title="Reservas com status" desc="Pendente, aprovado e concluído." />
                <Feature title="Aprovação e acompanhamento" desc="Controle simples para o time." />
              </div>
            </div>
          </div>
        </div>

        {/* Lado do formulário (COM DESFOQUE) */}
        <div className="relative flex items-center justify-center px-4 py-10 lg:px-12">
          {/* Camada desfocada apenas neste lado */}
          <div className="absolute inset-0 backdrop-blur-sm bg-slate-950/35" />

          <div className="relative w-full max-w-md">
            {/* Header mobile */}
            <div className="mb-6 lg:hidden text-center">
              <h1 className="mt-3 text-2xl font-semibold text-white">Gerenciador de Pátio</h1>
              <p className="mt-1 text-sm text-white/70">
                Agendamento e controle de cargas e descargas
              </p>
            </div>

            {/* Card */}
            <div className="rounded-2xl bg-white/95 backdrop-blur-2xl shadow-2xl ring-1 ring-black/5">
              <div className="h-1 w-full rounded-t-2xl bg-white/10" />
              <div className="p-6 sm:p-8">{children}</div>
            </div>

            <p className="mt-6 text-center text-xs text-white/60 lg:hidden">
              Multiempresa • Acesso seguro
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-3">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-sm text-white/70">{desc}</div>
    </div>
  );
}
