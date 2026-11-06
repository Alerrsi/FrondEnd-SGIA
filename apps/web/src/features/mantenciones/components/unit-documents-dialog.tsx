import { useRef, useState } from 'react';
import {
  useDeleteMaintenanceDocument,
  useDownloadMaintenanceDocument,
  useUnitMaintenanceDocuments,
  useUploadMaintenanceDocument,
} from '@sgia/api-client';
import type { EquipmentUnit, MaintenanceDocument, MaintenanceDocumentType } from '@sgia/types';
import { Download, FileUp, Loader2, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { formatDate } from '@/features/compras/lib/format';
import { downloadBlob } from '@/features/equipos/utils/download';
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
} from '@/features/mantenciones/lib/maintenance-labels';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';

const MAX_BYTES = 10 * 1024 * 1024;
const EXPIRING_DAYS = 30;

const controlClasses =
  'h-8 rounded-md border border-border bg-surface px-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-info disabled:opacity-50';

/** Documentos PDF de la unidad: vencimientos, subida (multipart) y descarga autenticada. */
export function UnitDocumentsDialog({
  unit,
  canWrite,
  onClose,
}: {
  unit: EquipmentUnit | null;
  canWrite: boolean;
  onClose: () => void;
}) {
  const [expiringOnly, setExpiringOnly] = useState(false);
  const { data, isLoading, isError, error } = useUnitMaintenanceDocuments(unit?.id, {
    expiring_within_days: expiringOnly ? EXPIRING_DAYS : undefined,
    per_page: 50,
  });
  const upload = useUploadMaintenanceDocument();
  const remove = useDeleteMaintenanceDocument();
  const download = useDownloadMaintenanceDocument();

  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<MaintenanceDocumentType>('certificado_calibracion');
  const [title, setTitle] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<MaintenanceDocument | null>(null);

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setErrors((e) => ({ ...e, file: 'Solo se aceptan archivos PDF.' }));
      return;
    }
    if (f.size > MAX_BYTES) {
      setErrors((e) => ({ ...e, file: 'El PDF no puede superar 10 MB.' }));
      return;
    }
    setErrors(({ file: _f, ...rest }) => rest);
    setFile(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unit) return;
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = 'Ingresa un título.';
    if (!file) next.file = 'Selecciona el PDF.';
    setErrors(next);
    if (!file || next.title) return;
    try {
      await upload.mutateAsync({
        unitId: unit.id,
        payload: {
          document_type: docType,
          title: title.trim(),
          file,
          valid_until: validUntil || null,
        },
      });
      toast.success('Documento subido');
      setTitle('');
      setValidUntil('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setErrors(apiFieldErrors(err));
      toast.error(apiErrorToMessage(err)); // incluye 429 (10/min)
    }
  };

  const handleDownload = async (doc: MaintenanceDocument) => {
    try {
      const blob = await download.mutateAsync(doc.id);
      downloadBlob(blob, doc.original_name || `${doc.title}.pdf`);
    } catch (err) {
      toast.error(apiErrorToMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success('Documento eliminado');
    } catch (err) {
      toast.error(apiErrorToMessage(err));
    } finally {
      setToDelete(null);
    }
  };

  const docs = data?.data ?? [];

  return (
    <Dialog
      open={unit !== null}
      onClose={onClose}
      title="Documentos de la unidad"
      description={unit ? `${unit.code} · certificados, manuales e informes en PDF` : undefined}
      className="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={expiringOnly}
              onChange={(e) => setExpiringOnly(e.target.checked)}
            />
            Vence pronto (≤ {EXPIRING_DAYS} días)
          </label>
          <span className="font-mono text-xs text-text-muted">{data?.meta.total ?? 0} documentos</span>
        </div>

        {isLoading ? (
          <Loader2 className="mx-auto h-4 w-4 animate-spin text-text-muted" />
        ) : isError ? (
          <p role="alert" className="text-xs text-rose-600">
            {apiErrorToMessage(error)}
          </p>
        ) : docs.length === 0 ? (
          <p className="py-4 text-center text-xs text-text-muted">Sin documentos para este filtro.</p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-md border border-border">
            {docs.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-medium text-text">{doc.title}</p>
                  <p className="text-text-muted">
                    {DOCUMENT_TYPE_LABELS[doc.document_type]} ·{' '}
                    {doc.valid_until ? `vence ${formatDate(doc.valid_until)}` : 'sin vencimiento'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {doc.is_expired && (
                    <Badge tone="critical" dot>
                      Vencido
                    </Badge>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Descargar ${doc.title}`}
                    disabled={download.isPending}
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  {canWrite && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Eliminar ${doc.title}`}
                      onClick={() => setToDelete(doc)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {canWrite && (
          <form onSubmit={submit} noValidate className="flex flex-col gap-2 border-t border-border pt-3">
            <div className="grid grid-cols-2 gap-2">
              <select
                aria-label="Tipo de documento"
                value={docType}
                onChange={(e) => setDocType(e.target.value as MaintenanceDocumentType)}
                className={controlClasses}
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {DOCUMENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <input
                type="date"
                aria-label="Válido hasta"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className={controlClasses}
              />
            </div>
            <input
              aria-label="Título del documento"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={controlClasses}
            />
            {errors.title && <p className="text-xs text-rose-600">{errors.title}</p>}
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                aria-label="Archivo PDF"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <FileUp className="h-3.5 w-3.5" />
                {file ? file.name : 'Seleccionar PDF (máx. 10 MB)'}
              </Button>
              <Button type="submit" size="sm" disabled={upload.isPending} className="ml-auto">
                {upload.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Subir documento
              </Button>
            </div>
            {(errors.file || errors.valid_until || errors.document_type) && (
              <p role="alert" className="text-xs text-rose-600">
                {errors.file ?? errors.valid_until ?? errors.document_type}
              </p>
            )}
          </form>
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar documento"
        description={`Se eliminará "${toDelete?.title ?? ''}" y su archivo.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </Dialog>
  );
}
