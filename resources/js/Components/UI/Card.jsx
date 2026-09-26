import React from 'react';

/** Superfície base para agrupar informações relacionadas. */
function Card({ children, className = '' }) {
  return (
    <section
      className={[
        'rounded-xl border border-areia-200 bg-white shadow-sm',
        'dark:border-areia-800 dark:bg-areia-900',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </section>
  );
}

Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={['border-b border-areia-200 px-6 py-4 dark:border-areia-800 [&_h2]:text-lg [&_h2]:font-semibold', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
};

Card.Content = function CardContent({ children, className = '' }) {
  return <div className={['p-6', className].filter(Boolean).join(' ')}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return (
    <div className={['border-t border-areia-200 px-6 py-4 dark:border-areia-800', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
};

export default Card;
