import React from 'react';
import { formatDateTime } from '@/utils/formatters';

/** Linha do tempo do agendamento: Agendado → Documentação → Chegada → Operação → Concluído. */
export default function BookingTimeline({ steps = [], cancelled = false }) {
  const lastDone = steps.reduce((acc, step, index) => (step.at ? index : acc), -1);

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const done = Boolean(step.at);
        const isNext = !cancelled && !done && index === lastDone + 1;

        return (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
            {index < steps.length - 1 && (
              <span
                className={`absolute left-[11px] top-6 h-[calc(100%-1rem)] w-0.5 ${done ? 'bg-pinho-500 dark:bg-pinho-400' : 'bg-areia-200 dark:bg-areia-700'}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2 ${
                done
                  ? 'bg-pinho-600 text-white ring-pinho-600 dark:bg-pinho-400 dark:text-areia-950 dark:ring-pinho-400'
                  : isNext
                    ? 'bg-white ring-ocre-400 dark:bg-areia-900'
                    : 'bg-white ring-areia-300 dark:bg-areia-900 dark:ring-areia-700'
              }`}
              aria-hidden="true"
            >
              {done && (
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none">
                  <path d="m5 10 3.5 3.5L15 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={`text-[15px] font-semibold ${done ? 'text-areia-900 dark:text-areia-100' : isNext ? 'text-ocre-800 dark:text-ocre-200' : 'text-areia-500 dark:text-areia-400'}`}>
                {step.label}
              </p>
              <p className="text-[13px] text-areia-500 dark:text-areia-400">
                {done ? formatDateTime(step.at) : isNext ? 'Próxima etapa' : 'Aguardando'}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
