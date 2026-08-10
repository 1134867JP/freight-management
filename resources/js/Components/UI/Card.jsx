import React from 'react';

/** Superfície base para agrupar informações relacionadas. */
function Card({ children, className = '' }) {
  return (
    <section
      className={[
        'rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]',
        'dark:border-slate-800 dark:bg-slate-900',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </section>
  );
}

Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={['border-b border-slate-200 px-5 py-4 dark:border-slate-800', className].filter(Boolean).join(' ')}>
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
