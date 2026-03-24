import React from 'react';

export default function FreightAttachmentsCell({ freight, onOpenAttachmentModal }) {
  const invoiceAttachment = freight.attachments?.find((a) => a.type === 'invoice');
  const adminAttachment = freight.attachments?.find((a) => a.type === 'attachment');

  return (
    <td className="w-[14%] px-4 py-4 align-middle">
      <div className="flex flex-wrap gap-1.5">
        {invoiceAttachment ? (
          <a
            href={`/storage/${invoiceAttachment.path}`}
            target="_blank"
            rel="noreferrer"
            title="Ver nota fiscal"
            className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
          >
            NF ↗
          </a>
        ) : (
          <span className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500">
            NF
          </span>
        )}

        {adminAttachment ? (
          <a
            href={`/storage/${adminAttachment.path}`}
            target="_blank"
            rel="noreferrer"
            title="Ver anexo admin"
            className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
          >
            Anexo ↗
          </a>
        ) : (
          <span className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500">
            Anexo
          </span>
        )}

        <button
          type="button"
          onClick={() => onOpenAttachmentModal(freight)}
          title="Adicionar anexo"
          className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
        >
          + Adicionar
        </button>
      </div>
    </td>
  );
}
