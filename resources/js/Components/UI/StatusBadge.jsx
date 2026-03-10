import React from 'react';

const arrToneClasses = {
  neutral: 'bg-gray-100 text-gray-700',
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
};

export default function StatusBadge({ label, tone = 'neutral', className = '' }) {
  const vlClassTone = arrToneClasses[tone] || arrToneClasses.neutral;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${vlClassTone} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
