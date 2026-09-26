import React from 'react';

/** Superfície base para agrupar informações relacionadas. */
function Card({ children, className = '' }) {
  return (
    <section
      className={[
        'rounded-sm border border-concrete-300 bg-white',
        'dark:border-concrete-800 dark:bg-concrete-900',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </section>
  );
}

Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={['border-b border-concrete-200 px-5 py-4 dark:border-concrete-800 [&_h2]:text-lg [&_h2]:uppercase [&_h2]:tracking-[0.04em]', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
};

Card.Content = function CardContent({ children, className = '' }) {
  return <div className={['p-5', className].filter(Boolean).join(' ')}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div className={['border-t border-slate-200 px-5 py-4 dark:border-slate-800', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
};

export default Card;
