import { useRef, useState } from 'react';
import { useCreateProducto, useScanInvoice } from '@sgia/api-client';
import type { BorradorProducto, CreateProductoPayload, InvoiceScanResponse } from '@sgia/types';
import {
  Check,
  FileText,
  FileUp,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { apiErrorToMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { AREAS_INACAP } from './inventario-table';

interface EditableDraftItem {
  id: string;
  name: string;
  quantity: number;
  stock_minimo: number;
  price: number;
  area: string;
  sala: string;
  cajon: string;
  barcode?: string;
}

const inputClasses =
  'w-full h-8 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 font-mono text-xs text-zinc-900 dark:text-zinc-100 transition-colors focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 disabled:opacity-50';

export function FacturaUploadModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanInvoice = useScanInvoice();
  const createProducto = useCreateProducto();

  // Estados del flujo
  const [isDragging, setIsDragging] = useState(false);
  const [scanResult, setScanResult] = useState<InvoiceScanResponse | null>(null);
  const [draftItems, setDraftItems] = useState<EditableDraftItem[]>([]);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  const resetModal = () => {
    setScanResult(null);
    setDraftItems([]);
    setIsSubmittingBatch(false);
    setBatchProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (isSubmittingBatch) return;
    resetModal();
    onClose();
  };

  const handleFileSelect = async (selectedFile: File) => {
    // Validar tamaño: máx 10MB
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede exceder los 10MB');
      return;
    }

    try {
      const res = await scanInvoice.mutateAsync(selectedFile);
      setScanResult(res);

      const rawProducts =
        res.products ||
        res.draft_products ||
        (res as any).productos ||
        (res as any).items ||
        [];

      const items = rawProducts.map(
        (p: BorradorProducto, index: number) => ({
          id: `item-${Date.now()}-${index}`,
          name: p.name || p.nombre || 'Producto nuevo',
          quantity: Number(p.quantity || p.stock || 1),
          stock_minimo: 5,
          price: Number(p.price || (p as any).precio || 0),
          area: 'Informática',
          sala: 'Pañol Central',
          cajon: '',
          barcode: p.barcode || (p as any).codigoBarras || undefined,
        }),
      );

      setDraftItems(items);
      toast.success(
        `Factura procesada: ${items.length} productos detectados para revisión`,
      );
    } catch (error) {
      toast.error(apiErrorToMessage(error));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleItemChange = (id: string, field: keyof EditableDraftItem, value: any) => {
    setDraftItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleRemoveItem = (id: string) => {
    setDraftItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddManualItem = () => {
    const newItem: EditableDraftItem = {
      id: `manual-${Date.now()}`,
      name: '',
      quantity: 1,
      stock_minimo: 5,
      price: 0,
      area: 'Informática',
      sala: 'Pañol Central',
      cajon: '',
    };
    setDraftItems((prev) => [...prev, newItem]);
  };

  const handleConfirmBatch = async () => {
    if (draftItems.length === 0) {
      toast.error('No hay productos para ingresar en inventario');
      return;
    }

    // Validar nombres
    const invalidItem = draftItems.find((i) => !i.name.trim());
    if (invalidItem) {
      toast.error('Todos los productos deben tener un nombre asignado');
      return;
    }

    setIsSubmittingBatch(true);
    setBatchProgress({ current: 0, total: draftItems.length });

    let successCount = 0;
    const errorsList: string[] = [];

    for (let i = 0; i < draftItems.length; i++) {
      const item = draftItems[i]!;
      setBatchProgress({ current: i + 1, total: draftItems.length });

      try {
        const payload: CreateProductoPayload = {
          name: item.name.trim(),
          quantity: item.quantity,
          stock_minimo: item.stock_minimo,
          area: item.area,
          sala: item.sala.trim() || undefined,
          cajon: item.cajon.trim() || undefined,
          barcode: item.barcode?.trim() || undefined,
        };
        await createProducto.mutateAsync(payload);
        successCount++;
      } catch (err) {
        errorsList.push(`${item.name}: ${apiErrorToMessage(err)}`);
      }
    }

    setIsSubmittingBatch(false);

    if (successCount > 0) {
      toast.success(
        `Se dieron de alta exitosamente ${successCount} productos en inventario`,
      );
      onSuccess?.();
      handleClose();
    }

    if (errorsList.length > 0) {
      toast.error(`Hubo errores al procesar ${errorsList.length} producto(s)`);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Alta de productos vía Factura (OCR)"
      description="Sube una factura de compra electrónica (PDF o imagen) para extraer automáticamente los ítems y dar de alta el stock en pañol."
      className="max-w-4xl"
    >
      <div className="flex flex-col gap-4 text-zinc-900 dark:text-zinc-100">
        {/* Paso 1: Dropzone (si aún no hay resultado) */}
        {!scanResult && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'relative flex flex-col items-center justify-center rounded-md border-2 border-dashed p-8 text-center transition-colors',
              isDragging
                ? 'border-zinc-400 bg-zinc-100 dark:bg-zinc-800'
                : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/40 hover:border-zinc-400 dark:hover:border-zinc-600',
              scanInvoice.isPending && 'pointer-events-none opacity-60',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.json"
              aria-label="Archivo de factura"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />

            {scanInvoice.isPending ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Extrayendo datos de la factura con OCR…
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  Analizando tablas de productos, cantidades y proveedores
                </span>
              </div>
            ) : (
              <>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 shadow-xs">
                  <UploadCloud className="h-6 w-6 text-zinc-500" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Arrastra aquí la factura o haz clic para seleccionarla
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  Formatos soportados: PDF, JPG, PNG o WEBP (máx. 10MB)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 text-xs"
                >
                  <FileUp className="h-3.5 w-3.5" />
                  <span>Seleccionar archivo local</span>
                </Button>
              </>
            )}
          </div>
        )}

        {/* Paso 2: Revisión interactiva de borradores */}
        {scanResult && (
          <div className="flex flex-col gap-3">
            {/* Header del documento escaneado */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-3">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-zinc-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {scanResult.invoice_number ||
                        (scanResult as any).numero_factura ||
                        'Factura detectada'}
                    </span>
                    <Badge tone="available">OCR Procesado</Badge>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Proveedor:{' '}
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {scanResult.supplier?.name ||
                        (scanResult as any).proveedor?.nombre ||
                        scanResult.supplier_name ||
                        'ElectroChile S.A.'}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetModal}
                  disabled={isSubmittingBatch}
                  className="text-xs"
                >
                  Cambiar archivo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddManualItem}
                  disabled={isSubmittingBatch}
                  className="text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Añadir ítem</span>
                </Button>
              </div>
            </div>

            {/* Tabla interactiva editable de borradores */}
            <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <table className="w-full border-collapse text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <th className="p-2.5">Producto</th>
                    <th className="w-20 p-2.5">Cantidad</th>
                    <th className="w-20 p-2.5">Stock Mín.</th>
                    <th className="w-24 p-2.5">P. Unitario</th>
                    <th className="w-32 p-2.5">Área</th>
                    <th className="w-28 p-2.5">Sala</th>
                    <th className="w-24 p-2.5">Cajón</th>
                    <th className="w-12 p-2.5 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {draftItems.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.name}
                          disabled={isSubmittingBatch}
                          onChange={(e) =>
                            handleItemChange(item.id, 'name', e.target.value)
                          }
                          className={inputClasses}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          disabled={isSubmittingBatch}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              'quantity',
                              Math.max(1, Number(e.target.value) || 1),
                            )
                          }
                          className={inputClasses}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={0}
                          value={item.stock_minimo}
                          disabled={isSubmittingBatch}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              'stock_minimo',
                              Math.max(0, Number(e.target.value) || 0),
                            )
                          }
                          className={inputClasses}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={0}
                          value={item.price}
                          disabled={isSubmittingBatch}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              'price',
                              Math.max(0, Number(e.target.value) || 0),
                            )
                          }
                          className={inputClasses}
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={item.area}
                          disabled={isSubmittingBatch}
                          onChange={(e) =>
                            handleItemChange(item.id, 'area', e.target.value)
                          }
                          className={inputClasses}
                        >
                          {AREAS_INACAP.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.sala}
                          disabled={isSubmittingBatch}
                          placeholder="Sala…"
                          onChange={(e) =>
                            handleItemChange(item.id, 'sala', e.target.value)
                          }
                          className={inputClasses}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.cajon}
                          disabled={isSubmittingBatch}
                          placeholder="Cajón…"
                          onChange={(e) =>
                            handleItemChange(item.id, 'cajon', e.target.value)
                          }
                          className={inputClasses}
                        />
                      </td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isSubmittingBatch}
                          className="rounded p-1 text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors focus:outline-none"
                          title="Quitar producto de la lista"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Barra de progreso de subida en lote */}
            {isSubmittingBatch && (
              <div className="flex flex-col gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    Creando productos en el catálogo…
                  </span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-400 tabular-nums">
                    {batchProgress.current} de {batchProgress.total}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
                    style={{
                      width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Botones de acción final */}
            <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-3.5">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                {draftItems.length} producto(s) listo(s) para dar de alta en pañol
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  disabled={isSubmittingBatch}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmBatch}
                  disabled={isSubmittingBatch || draftItems.length === 0}
                  className="min-w-44 text-xs"
                >
                  {isSubmittingBatch ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Guardando lote…</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Confirmar y dar de alta ({draftItems.length})</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
