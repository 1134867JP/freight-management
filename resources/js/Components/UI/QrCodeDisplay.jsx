import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

export default function QrCodeDisplay({ value, size = 180, label }) {
  const canvasRef = useRef(null);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: { dark: '#111827', light: '#ffffff' },
    }, err => {
      if (err) setError(err.message);
    });
  }, [value, size]);

  if (!value) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      {error ? (
        <p className="text-xs text-red-500">Erro ao gerar QR Code</p>
      ) : (
        <canvas ref={canvasRef} className="rounded-lg border border-gray-200 dark:border-gray-700" />
      )}
      {label && <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>}
    </div>
  );
}
