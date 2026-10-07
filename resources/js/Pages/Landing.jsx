import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';

/*
 * Landing page: o pátio 3D fica fixo ao fundo e conta a história do
 * CargoHub conforme a rolagem — cotas → agendamento → portaria → doca →
 * tudo registrado. Painéis de vidro entram em cena ao aparecer na tela.
 */

const CHAPTERS = [
  {
    id: 'inicio',
    eyebrow: 'Pátio digital',
    title: 'Seu pátio, do agendamento à saída.',
    text: 'A empresa publica as cotas, os clientes se organizam sozinhos e a operação acompanha tudo em um só lugar. Sem caçar informação no WhatsApp.',
    chip: null,
  },
  {
    id: 'cotas',
    eyebrow: '01 · Cotas',
    title: 'Publique as cotas em uma ação.',
    text: 'Produto, destino, quantidade, período e horários. O CargoHub monta a grade e controla a disponibilidade em tempo real — sem overbooking.',
    chip: { label: 'COT-0001 · Soja → B&8', value: '150 cotas publicadas' },
  },
  {
    id: 'agendamento',
    eyebrow: '02 · Agendamento',
    title: 'O cliente agenda sozinho.',
    text: 'Ele vê o saldo dele, escolhe o dia e o horário livre e recebe o código na hora. O WhatsApp só avisa e leva ao link.',
    chip: { label: 'Agendamento confirmado', value: 'AGD-10482 · 10/10 às 09:00' },
  },
  {
    id: 'portaria',
    eyebrow: '03 · Portaria',
    title: 'Chegada sem fila de papel.',
    text: 'Placa, motorista e NF já estão no agendamento. A portaria confere, registra a chegada e libera a cancela.',
    chip: { label: 'Check-in', value: 'ABC1D23 · Carlos' },
  },
  {
    id: 'doca',
    eyebrow: '04 · Doca',
    title: 'Da doca à saída, tudo rastreado.',
    text: 'NF, comprovante de peso e comprovantes ficam no agendamento. A operação vê o próximo passo de cada veículo.',
    chip: { label: 'Documentação', value: 'NF ✓  ·  Peso ✓' },
  },
  {
    id: 'registro',
    eyebrow: '05 · Controle',
    title: 'Cada cota, do início ao fim.',
    text: 'Publicadas, reservadas, em operação, utilizadas e não utilizadas. Sinais simples mostram onde agir antes do problema.',
    chip: { label: 'Hoje', value: '42 reservadas · 31 utilizadas' },
  },
];

const FEATURES = [
  { title: 'Para a empresa', items: ['Publicação de cotas em uma tela', 'Central com o que pede atenção agora', 'Portaria, docas e não comparecimento'] },
  { title: 'Para o cliente', items: ['Saldo de cotas sempre visível', 'Agendamento em poucos toques', 'NF e comprovantes no próprio agendamento'] },
  { title: 'Para todos', items: ['WhatsApp como canal, não como sistema', 'Disponibilidade sem overbooking', 'Histórico completo e rastreável'] },
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** Elementos com data-reveal entram em cena quando aparecem na tela. */
function useReveal(rootRef) {
  useEffect(() => {
    const nodes = rootRef.current?.querySelectorAll('[data-reveal]') ?? [];
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.setAttribute('data-shown', '');
      }),
      { threshold: 0.25 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [rootRef]);
}

export default function Landing({ canLogin = true }) {
  const rootRef = useRef(null);
  const storyRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [sceneState, setSceneState] = useState('loading'); // loading | ready | fallback
  const [active, setActive] = useState(0);
  const [entering, setEntering] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useReveal(rootRef);

  // Cena 3D carregada sob demanda (o three.js não pesa no restante do app).
  useEffect(() => {
    let disposed = false;
    let scene;
    import('@/Features/Landing/YardScene').then(({ default: YardScene, supportsWebGL }) => {
      if (disposed || !canvasRef.current) return;
      if (!supportsWebGL()) {
        setSceneState('fallback');
        return;
      }
      scene = new YardScene(canvasRef.current, { reducedMotion });
      sceneRef.current = scene;
      scene.start();
      setSceneState('ready');
    }).catch(() => setSceneState('fallback'));

    return () => {
      disposed = true;
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [reducedMotion]);

  // Rolagem → progresso da história.
  useEffect(() => {
    const onScroll = () => {
      const story = storyRef.current;
      if (!story) return;
      const rect = story.getBoundingClientRect();
      const total = story.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
      sceneRef.current?.setProgress(p);
      setActive(Math.min(CHAPTERS.length - 1, Math.round(p * (CHAPTERS.length - 1))));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [sceneState]);

  // Pausa a renderização quando a cena sai da tela ou a aba fica oculta.
  useEffect(() => {
    if (sceneState !== 'ready') return undefined;
    const onVisibility = () => (document.hidden ? sceneRef.current?.stop() : sceneRef.current?.start());
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !document.hidden) sceneRef.current?.start();
      else sceneRef.current?.stop();
    });
    if (storyRef.current) observer.observe(storyRef.current);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [sceneState]);

  const onPointerMove = (event) => {
    if (reducedMotion) return;
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = (event.clientY / window.innerHeight) * 2 - 1;
    sceneRef.current?.setPointer(x, -y);
  };

  // "Entrar": a cancela sobe e a câmera atravessa a portaria até o login.
  const enter = (event) => {
    event.preventDefault();
    if (entering) return;
    setEntering(true);
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    const go = () => router.visit(route('login'));
    if (sceneRef.current) sceneRef.current.playEnter(go);
    else go();
  };

  const chapter = CHAPTERS[active];

  return (
    <div ref={rootRef} className="landing relative min-h-screen bg-[#06110C] text-white" onPointerMove={onPointerMove}>
      <Head title="Cotas, agendamento e pátio em um só lugar" />

      {/* Fundo: pátio 3D fixo */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_0%,#123527_0%,#06110C_60%)]" />
        <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${sceneState === 'ready' ? 'opacity-100' : 'opacity-0'}`} />
        {sceneState === 'fallback' && (
          <img src="/bg-yard.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        )}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#06110C]/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#06110C]/70 to-transparent" />
        <div className={`absolute inset-0 bg-[#F5F1E8] transition-opacity duration-500 ${entering ? 'opacity-100 delay-1000' : 'opacity-0'}`} />
      </div>

      {/* Cabeçalho de vidro */}
      <header className="fixed inset-x-0 top-0 z-30 px-4 pt-4 sm:px-6">
        <nav className="glass-night mx-auto flex max-w-6xl items-center justify-between rounded-full py-2 pl-3 pr-2 sm:pl-4" aria-label="Principal">
          <a href="#inicio" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.02em]">
            <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-pinho-500 to-pinho-800 text-white shadow-[0_0_18px_rgba(94,224,160,0.35)]" aria-hidden="true">
              <svg className="-mt-0.5 h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M3 7.5h10.5v7H3v-7Zm10.5 2h3l3 3v2h-6v-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="currentColor" strokeWidth="1.8" /></svg>
              
            </span>
            CargoHub
          </a>
          <div className="hidden items-center gap-1 text-[15px] font-medium text-white/65 md:flex">
            {CHAPTERS.slice(1, 5).map((item) => (
              <a key={item.id} href={`#${item.id}`} className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-white/10 hover:text-white">
                {item.eyebrow.split('· ')[1]}
              </a>
            ))}
          </div>
          {canLogin && (
            <a href={route('login')} onClick={enter} className="btn-neon inline-flex min-h-10 items-center gap-2 rounded-full px-5 text-[15px] font-semibold">
              Entrar
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          )}
        </nav>
      </header>

      {/* História guiada pela rolagem */}
      <main className="relative z-10">
        <section ref={storyRef} className="relative" aria-label="Como o CargoHub funciona">
          {CHAPTERS.map((item, index) => (
            <div key={item.id} id={item.id} className={`flex min-h-[100vh] items-end px-4 pb-24 sm:px-6 md:items-center md:pb-0 ${index === 0 ? 'pt-24' : ''}`}>
              <div className="mx-auto w-full max-w-6xl">
                <article data-reveal className={`reveal glass-night max-w-[31rem] rounded-[28px] p-6 sm:p-9 ${index % 2 === 1 ? 'md:ml-auto' : ''}`}>
                  <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-ocre-300"><span className="h-1.5 w-1.5 rounded-full bg-ocre-300 shadow-[0_0_10px_#F2B640]" aria-hidden="true" />{item.eyebrow}</p>
                  {index === 0 ? (
                    <h1 className="text-gradient mt-4 font-display text-[42px] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[60px]">{item.title}</h1>
                  ) : (
                    <h2 className="text-gradient mt-4 font-display text-[32px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[40px]">{item.title}</h2>
                  )}
                  <p className="mt-4 text-[17px] leading-relaxed text-white/70">{item.text}</p>
                  {item.chip && (
                    <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] py-2.5 pl-3 pr-5">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#5EE0A0] shadow-[0_0_14px_#5EE0A0]" aria-hidden="true" />
                      <span>
                        <span className="block text-[12px] uppercase tracking-[0.12em] text-white/45">{item.chip.label}</span>
                        <span className="block font-display text-[17px] font-bold text-white">{item.chip.value}</span>
                      </span>
                    </div>
                  )}
                  {index === 0 && canLogin && (
                    <div className="mt-7 flex flex-wrap items-center gap-3">
                      <a href={route('login')} onClick={enter} className="btn-neon inline-flex min-h-[54px] items-center gap-2 rounded-full px-7 text-base font-semibold">
                        Entrar no CargoHub
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                      </a>
                      <a href="#cotas" className="inline-flex min-h-[54px] items-center rounded-full border border-white/15 px-6 text-base font-semibold text-white/85 transition-colors hover:bg-white/10">
                        Ver como funciona
                      </a>
                    </div>
                  )}
                </article>
              </div>
            </div>
          ))}

          {/* Indicador de progresso da história */}
          <div className="pointer-events-none sticky bottom-6 z-20 -mt-20 flex justify-center pb-6" aria-hidden="true">
            <div className="glass-night flex items-center gap-2 rounded-full px-3.5 py-2">
              {CHAPTERS.map((item, index) => (
                <span key={item.id} className={`h-1.5 rounded-full transition-all duration-500 ${index === active ? 'w-8 bg-ocre-300 shadow-[0_0_10px_#F2B640]' : 'w-1.5 bg-white/25'}`} />
              ))}
              <span className="ml-1 text-[13px] font-semibold text-white/75">{chapter.eyebrow.split('· ')[1] ?? 'Início'}</span>
            </div>
          </div>
        </section>

        {/* Recursos */}
        <section className="relative px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 data-reveal className="reveal text-gradient max-w-2xl font-display text-[36px] font-bold leading-tight tracking-[-0.03em] sm:text-[48px]">
              Menos mensagens. Mais operação.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {FEATURES.map((group, index) => (
                <div key={group.title} data-reveal className="reveal glass-night rounded-[28px] p-7" style={{ transitionDelay: `${index * 120}ms` }}>
                  <p className="font-display text-xl font-bold text-white">{group.title}</p>
                  <ul className="mt-4 space-y-3">
                    {group.items.map((feature) => (
                      <li key={feature} className="flex gap-3 text-[16px] text-white/70">
                        <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5EE0A0]/15 text-[#5EE0A0] ring-1 ring-[#5EE0A0]/40" aria-hidden="true">
                          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none"><path d="m5 10 3.5 3.5L15 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Chamada final */}
        <section className="relative px-4 pb-16 sm:px-6">
          <div data-reveal className="reveal glass-night neon-border mx-auto max-w-6xl rounded-[36px] px-6 py-16 text-center sm:px-12">
            <h2 className="text-gradient mx-auto max-w-3xl font-display text-[34px] font-bold leading-tight tracking-[-0.03em] sm:text-[48px]">
              A empresa publica. O cliente agenda. O pátio flui.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">Entre no CargoHub e acompanhe cotas, agendamentos e documentos em tempo real.</p>
            {canLogin && (
              <Link href={route('login')} onClick={enter} className="btn-neon mt-8 inline-flex min-h-[54px] items-center gap-2 rounded-full px-8 text-base font-semibold">
                Entrar
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
            )}
          </div>
          <p className="mt-10 text-center text-sm text-white/40">© {new Date().getFullYear()} CargoHub · Gestão de cotas e pátio</p>
        </section>
      </main>
    </div>
  );
}
