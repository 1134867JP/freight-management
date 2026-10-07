import React, { useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import Button from '@/Components/UI/Button';
import FormField from '@/Components/UI/FormField';
import { formatDateTime } from '@/utils/formatters';

/*
 * Checklist de documentos do agendamento com envio direto em cada item.
 * `uploadUrl` aponta para a rota do cliente ou da operação; o backend
 * decide quais tipos cada perfil pode enviar.
 */
export default function DocumentChecklist({ documents = [], uploadUrl, canUpload = true }) {
  const [openType, setOpenType] = useState(null);

  return (
    <ul className="divide-y divide-areia-200 dark:divide-areia-800">
      {documents.map((doc) => (
        <li key={doc.type} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <StatusIcon received={doc.received} required={doc.required} />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-areia-900 dark:text-areia-100">
                  {doc.label}
                  {!doc.required && <span className="ml-2 text-[13px] font-normal text-areia-500">opcional</span>}
                </p>
                {doc.hint && <p className="text-[13px] text-areia-500 dark:text-areia-400">{doc.hint}</p>}
                <p className={`text-sm ${doc.received ? 'text-pinho-700 dark:text-pinho-300' : doc.required ? 'text-ocre-800 dark:text-ocre-200' : 'text-areia-500'}`}>
                  {doc.received ? (doc.type === 'invoice' ? 'Recebida' : 'Recebido') : doc.required ? 'Pendente' : (doc.type === 'invoice' ? 'Não enviada' : 'Não enviado')}
                </p>
                {doc.files?.length > 0 && (
                  <ul className="mt-1.5 space-y-1">
                    {doc.files.map((file) => (
                      <li key={file.id} className="text-sm">
                        <a href={file.url} className="font-medium text-pinho-700 underline-offset-2 hover:underline dark:text-pinho-300">
                          {file.name}
                        </a>
                        <span className="ml-2 text-areia-500">{formatDateTime(file.uploaded_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {canUpload && uploadUrl && openType !== doc.type && (
              <Button
                variant={doc.required && !doc.received ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setOpenType(doc.type)}
              >
                {doc.type === 'receipt' ? 'Adicionar anexo' : doc.received ? 'Substituir' : 'Enviar'}
              </Button>
            )}
          </div>
          {openType === doc.type && (
            <UploadForm type={doc.type} label={doc.label} uploadUrl={uploadUrl} onDone={() => setOpenType(null)} />
          )}
        </li>
      ))}
    </ul>
  );
}

function UploadForm({ type, label, uploadUrl, onDone }) {
  const fileInput = useRef(null);
  const { data, setData, post, processing, errors, reset } = useForm({
    type,
    file: null,
    invoice_number: '',
    weight_tons: '',
  });

  const submit = (event) => {
    event.preventDefault();
    post(uploadUrl, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        reset();
        onDone();
      },
    });
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-lg border border-areia-200 bg-areia-50 p-4 dark:border-areia-800 dark:bg-areia-950/40">
      <FormField id={`file-${type}`} label={`Arquivo — ${label}`} error={errors.file} hint="PDF ou foto (JPG, PNG), até 10MB." required>
        <input
          ref={fileInput}
          id={`file-${type}`}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(event) => setData('file', event.target.files?.[0] ?? null)}
          className="mt-1.5 block w-full text-sm text-areia-700 file:mr-3 file:rounded-md file:border-0 file:bg-pinho-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-pinho-800 dark:text-areia-300"
        />
      </FormField>
      {type === 'invoice' && (
        <FormField id={`invoice-number-${type}`} label="Número da NF" error={errors.invoice_number}>
          <input
            id={`invoice-number-${type}`}
            value={data.invoice_number}
            onChange={(event) => setData('invoice_number', event.target.value)}
            className={FormField.inputClass(errors.invoice_number, 'mt-1.5')}
            placeholder="Ex.: 000123456"
          />
        </FormField>
      )}
      {type === 'weight_ticket' && (
        <FormField id={`weight-${type}`} label="Peso (toneladas)" error={errors.weight_tons}>
          <input
            id={`weight-${type}`}
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={data.weight_tons}
            onChange={(event) => setData('weight_tons', event.target.value)}
            className={FormField.inputClass(errors.weight_tons, 'mt-1.5')}
            placeholder="Ex.: 20,5"
          />
        </FormField>
      )}
      {errors.type && <p className="text-sm text-tijolo-700">{errors.type}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={processing} disabled={!data.file}>Enviar documento</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  );
}

function StatusIcon({ received, required }) {
  if (received) {
    return (
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pinho-100 text-pinho-700 dark:bg-pinho-900/60 dark:text-pinho-200" aria-hidden="true">
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none"><path d="m5 10 3.5 3.5L15 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    );
  }

  return (
    <span
      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${required ? 'bg-ocre-100 text-ocre-800 dark:bg-ocre-900/50 dark:text-ocre-200' : 'bg-areia-100 text-areia-500 dark:bg-areia-800'}`}
      aria-hidden="true"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none"><path d="M10 6v5m0 3h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
    </span>
  );
}
