import { fetchProductLabel, useProductBarcode } from '@sgia/api-client';
import type { Producto } from '@sgia/types';
import {
  AlertTriangle,
  ArrowRightLeft,
  Barcode,
  Calendar,
  Check,
  Copy,
  Loader2,
  MapPin,
  Pencil,
  Printer,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { printBlob } from '@/features/equipos/utils/download';
import { apiErrorToMessage } from '@/lib/api-error';
import { toast } from '@/lib/toast';

import { useOptionalAuth } from '@/features/auth/context/auth-context';
import { ProductoUnidadesPanel } from './producto-unidades-panel';

export interface ProductoDetailDialogProps {
  open: boolean;
  onClose: () => void;
  producto: Producto | null;
  onEdit?: (producto: Producto) => void;
  onReubicar?: (producto: Producto) => void;
}

export function ProductoDetailDialog({
  open,
  onClose,
  producto,
  onEdit,
  onReubicar,
}: ProductoDetailDialogProps) {
  const [copied, setCopied] = useState(false);
  // Mantenciones y documentos: escritura solo AD-01 y PAN-01 (sin sesión, p. ej. en tests, se permite).
  const role = useOptionalAuth()?.user?.rol;
  const canMaintain = role === undefined || role === 'AD-01' || role === 'PAN-01';
  const canPrintServerLabel =
    producto?.type === 'insumo' &&
    (role === undefined || role === 'AD-01' || role === 'DIR-01' || role === 'PAN-01');
  const { data: barcodeData, isLoading: isBarcodeLoading } = useProductBarcode(
    open && producto ? producto.id : undefined,
  );

  if (!producto) return null;

  const barcode = producto.codigoBarras || producto.barcode || 'SIN-CODIGO';

  const handleCopyBarcode = () => {
    if (barcode && barcode !== 'SIN-CODIGO') {
      navigator.clipboard.writeText(barcode);
      setCopied(true);
      toast.success(`Código ${barcode} copiado al portapapeles`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleServerLabel = async () => {
    try {
      printBlob(await fetchProductLabel(producto.id));
    } catch (e) {
      toast.error(apiErrorToMessage(e));
    }
  };

  const handlePrintLabel = () => {
    const svgContent = barcodeData?.svg || '';
    const printWindow = window.open('', '_blank', 'width=450,height=350');
    if (printWindow && printWindow.document) {
      try {
        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${barcode}</title>
          <style>
            @page { size: 50mm 30mm; margin: 0; }
            html, body { width: 50mm; height: 30mm; margin: 0; padding: 0; overflow: hidden; background: #fff; color: #000; }
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
            .barcode-svg svg { width: 44mm; height: 18mm; }
            .code-text { font-family: monospace; font-size: 10pt; font-weight: bold; letter-spacing: 1px; margin-top: 1mm; }
          </style>
        </head>
        <body>
          <div class="barcode-svg">${svgContent}</div>
          <div class="code-text">${barcode}</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
        `);
        printWindow.document.close();
      } catch {
        // fallback
      }
    }
  };

  const isCritical = producto.stock <= (producto.stockCritico ?? producto.stock_minimo ?? 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Ficha técnica de inventario"
      description={`Especificaciones técnicas de hardware y código óptico · ID #${producto.id}`}
      className="max-w-3xl"
    >
      <div className="flex flex-col gap-4 text-text">
        {/* Cabecera del producto */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3.5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold tracking-tight leading-snug">
              {producto.nombre}
            </h2>
            {producto.description ? (
              <p className="text-xs text-text-muted leading-relaxed max-w-md">{producto.description}</p>
            ) : (
              <p className="text-xs text-text-muted italic">Sin descripción complementaria</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {producto.categoria && (
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-raised text-text border border-border">
                {producto.categoria}
              </span>
            )}
            {producto.area && (
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-raised text-text-muted border border-border">
                {producto.area}
              </span>
            )}
            {producto.activo ? (
              <Badge tone="available">Activo</Badge>
            ) : (
              <Badge tone="retired">Inactivo</Badge>
            )}
          </div>
        </div>

        {/* Módulo de Identificación Óptica Code128 */}
        <div className="flex flex-col items-center justify-center rounded-md border border-border bg-background p-4">
          <div className="mb-2.5 flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted font-mono">
              <Barcode aria-hidden="true" className="h-4 w-4 text-text-muted" />
              Rotulado Code128 de Pañol
            </span>
            <button
              type="button"
              onClick={handleCopyBarcode}
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text transition-colors"
              title="Copiar código al portapapeles"
            >
              {copied ? <Check aria-hidden="true" className="h-3.5 w-3.5 text-ok" /> : <Copy aria-hidden="true" className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          {/* Tarjeta de alto contraste para lectura por pistola (fondo blanco puro) */}
          <div
            data-testid="barcode-container"
            className="flex min-h-[96px] w-full max-w-sm flex-col items-center justify-center rounded-md border border-border bg-surface p-3 text-black shadow-xs"
          >
            {isBarcodeLoading ? (
              <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-text-muted" />
                <span>Generando código vectorial…</span>
              </div>
            ) : barcodeData?.svg ? (
              <div
                data-testid="barcode-svg"
                className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-14"
                dangerouslySetInnerHTML={{ __html: barcodeData.svg }}
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-text-muted">
                <Barcode aria-hidden="true" className="h-8 w-8 opacity-40" />
                <span className="text-xs font-mono">SVG no disponible</span>
              </div>
            )}
            <span className="mt-1 font-mono text-xs font-semibold tracking-widest text-black">
              {barcode}
            </span>
          </div>

          <p className="mt-2 text-xs text-text-muted font-mono text-center">
            Lectura continua soportada con escáner USB / Bluetooth en mesón.
          </p>
        </div>

        {/* Especificaciones Técnicas y Parámetros Operativos */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Tarjeta de Stock */}
          <div className="rounded-md border border-border bg-surface p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="font-mono">Control de Inventario</span>
              <Badge tone={isCritical ? 'critical' : 'available'}>
                {isCritical ? 'Crítico' : 'Normal'}
              </Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-text tabular-nums">
                {producto.stock}
              </span>
              <span className="text-xs text-text-muted font-medium">unidades en pañol</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs border-t border-border pt-2 font-mono">
              <span className="text-text-muted">Umbral mínimo:</span>
              <span className="font-semibold text-text tabular-nums">
                {producto.stockCritico ?? producto.stock_minimo ?? 0} uds
              </span>
            </div>
            {isCritical && (
              <div className="mt-2.5 flex items-center gap-1.5 rounded bg-danger-bg border border-danger/30 px-2 py-1 text-xs text-danger">
                <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-danger" />
                <span>Nivel de stock bajo umbral crítico</span>
              </div>
            )}
          </div>

          {/* Tarjeta de Ubicación Física */}
          <div className="rounded-md border border-border bg-surface p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="font-mono">Ubicación en Pañol</span>
              <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-text-muted" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-text">
                {producto.ubicacion?.sala || 'Sala sin asignar'}
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs border-t border-border pt-2 font-mono">
              <span className="text-text-muted">Gaveta / Cajón:</span>
              <span className="font-semibold text-text">
                {producto.ubicacion?.cajon || 'Sin cajón'}
              </span>
            </div>
            {producto.ubicacion?.descripcion && (
              <p className="mt-2 text-xs text-text-muted font-mono line-clamp-2">
                {producto.ubicacion.descripcion}
              </p>
            )}
          </div>
        </div>

        {/* Unidades individuales (equipo / maqueta) */}
        {(producto.type === 'equipo' || producto.type === 'maqueta') && (
          <ProductoUnidadesPanel producto={producto} canMaintain={canMaintain} />
        )}

        {/* Metadatos de Creación / Auditoría */}
        <div className="flex items-center justify-between text-xs text-text-muted font-mono border-t border-border pt-2.5">
          <div className="flex items-center gap-1.5">
            <Calendar aria-hidden="true" className="h-3.5 w-3.5 text-text-muted" />
            <span>
              Ingresado:{' '}
              {producto.createdAt
                ? new Date(producto.createdAt).toLocaleDateString('es-CL', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </span>
          </div>
          <span className="text-text-muted">SGIA · Pañol TI</span>
        </div>

        {/* Acciones de Pie */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={canPrintServerLabel ? handleServerLabel : handlePrintLabel}
            className="flex items-center gap-1.5 text-xs"
          >
            <Printer aria-hidden="true" className="h-3.5 w-3.5 text-text-muted" />
            <span>{canPrintServerLabel ? 'Imprimir etiqueta' : 'Imprimir etiqueta térmica'}</span>
          </Button>

          <div className="flex items-center gap-2">
            {onReubicar && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onReubicar(producto);
                }}
                className="flex items-center gap-1.5 text-xs"
              >
                <ArrowRightLeft aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Reubicar</span>
              </Button>
            )}
            {onEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(producto);
                }}
                className="flex items-center gap-1.5 text-xs"
              >
                <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Editar producto</span>
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
