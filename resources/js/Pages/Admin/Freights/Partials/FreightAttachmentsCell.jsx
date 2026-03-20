import React from 'react';

export default function FreightAttachmentsCell({ freight, onOpenAttachmentModal }) {
  const invoiceAttachment = freight.attachments?.find((a) => a.type === 'invoice');
  const adminAttachment = freight.attachments?.find((a) => a.type === 'attachment');

  return (
    <td className="w-[16%] px-4 py-4 align-top text-sm">
      <div className="space-y-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Nota Fiscal</p>
          <p className={`font-medium ${invoiceAttachment ? 'text-green-700' : 'text-gray-500'}`}>
            {invoiceAttachment ? 'Enviado' : 'Não enviado'}
          </p>
          {invoiceAttachment && (
            <a
              href={`/storage/${invoiceAttachment.path}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-blue-600 underline"
            >
              Ver nota fiscal
            </a>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Anexo Admin</p>
          <p className={`font-medium ${adminAttachment ? 'text-green-700' : 'text-gray-500'}`}>
            {adminAttachment ? 'Enviado' : 'Não enviado'}
          </p>
          {adminAttachment && (
            <a
              href={`/storage/${adminAttachment.path}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-blue-600 underline"
            >
              Ver anexo
            </a>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => onOpenAttachmentModal(freight)}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Adicionar anexo
          </button>
        </div>
      </div>
    </td>
  );
}
