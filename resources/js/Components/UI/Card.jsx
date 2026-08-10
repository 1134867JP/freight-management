import React from 'react';

/** Superfície base para agrupar informações relacionadas. */
function Card({ children, className = '' }) {
  return (
    <section
      className={[
        'rounded-xl border border-gray-200 bg-white shadow-sm',
        'dark:border-gray-700 dark:bg-gray-800',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </section>
  );
}

Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={['border-b border-gray-100 px-5 py-4 dark:border-gray-700', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
};

Card.Content = function CardContent({ children, className = '' }) {
  return <div className={['p-5', className].filter(Boolean).join(' ')}>{children}</div>;
};

export default Card;
