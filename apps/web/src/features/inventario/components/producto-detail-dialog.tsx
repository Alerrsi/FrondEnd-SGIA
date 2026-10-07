import { useProductBarcode } from '@sgia/api-client';
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
import { toast } from '@/lib/toast';

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

  const handlePrintLabel = () => {
    const svgContent = barcodeData?.svg || '';
    const printWindow = window.open('', '_blank', 'width=450,height=350');
    if (printWindow && printWindow.document) {
      try {
        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta - ${producto.nombre}</title>
          <style>
            @page { size: auto; margin: 5mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
              text-align: center;
              padding: 10px;
              margin: 0;
              color: #000;
              background: #fff;
            }
            .header {
              font-size: 14px;
              weight: bold;
              margin-bottom: 2px;
              text-transform: uppercase;
            }
            .sub {
              font-size: 11px;
              color: #444;
              margin-bottom: 8px;
            }
            .barcode-svg svg {
              max-width: 100%;
              height: 55px;
            }
            .code-text {
              font-family: monospace;
              font-size: 13px;
              font-weight: bold;
              letter-spacing: 2px;
              margin-top: 4px;
            }
            .location {
              font-size: 10px;
              font-weight: bold;
              margin-top: 6px;
              border-top: 1px dashed #666;
              padding-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="header">${producto.nombre}</div>
          <div class="sub">${producto.area || 'Área Informática y Ciberseguridad'} · INACAP Sede Temuco</div>
          <div class="barcode-svg">${svgContent}</div>
          <div class="code-text">${barcode}</div>
          <div class="location">Ubicación: ${producto.ubicacion?.sala || 'Pañol'} · Cajón: ${producto.ubicacion?.cajon || 'General'}</div>
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
    window.print();
  };

  const isCritical = producto.stock <= (producto.stockCritico ?? producto.stock_minimo ?? 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Ficha técnica de inventario"
      description={`Especificaciones técnicas de hardware y código óptico · ID #${producto.id}`}
      className="max-w-xl"
    >
      <div className="flex flex-col gap-4 text-zinc-900 dark:text-zinc-100">
        {/* Cabecera del producto */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3.5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold tracking-tight leading-snug">
              {producto.nombre}
            </h2>
            {producto.description ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md">{producto.description}</p>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">Sin descripción complementaria</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {producto.categoria && (
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                {producto.categoria}
              </span>
            )}
            {producto.area && (
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100/60 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
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
        <div className="flex flex-col items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-4">
          <div className="mb-2.5 flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-mono">
              <Barcode className="h-4 w-4 text-zinc-500" />
              Rotulado Code128 de Pañol
            </span>
            <button
              type="button"
              onClick={handleCopyBarcode}
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              title="Copiar código al portapapeles"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          {/* Tarjeta de alto contraste para lectura por pistola (fondo blanco puro) */}
          <div
            data-testid="barcode-container"
            className="flex min-h-[96px] w-full max-w-sm flex-col items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-white p-3 text-black shadow-xs"
          >
            {isBarcodeLoading ? (
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
                <span>Generando código vectorial…</span>
              </div>
            ) : barcodeData?.svg ? (
              <div
                data-testid="barcode-svg"
                className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-14"
                dangerouslySetInnerHTML={{ __html: barcodeData.svg }}
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-zinc-400">
                <Barcode className="h-8 w-8 opacity-40" />
                <span className="text-[11px] font-mono">SVG no disponible</span>
              </div>
            )}
            <span className="mt-1 font-mono text-xs font-semibold tracking-widest text-black">
              {barcode}
            </span>
          </div>

          <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500 font-mono text-center">
            Lectura continua soportada con escáner USB / Bluetooth en mesón.
          </p>
        </div>

        {/* Especificaciones Técnicas y Parámetros Operativos */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Tarjeta de Stock */}
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-mono">Control de Inventario</span>
              <Badge tone={isCritical ? 'critical' : 'available'}>
                {isCritical ? 'Crítico' : 'Normal'}
              </Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {producto.stock}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">unidades en pañol</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs border-t border-zinc-100 dark:border-zinc-800 pt-2 font-mono">
              <span className="text-zinc-500 dark:text-zinc-400">Umbral mínimo:</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">
                {producto.stockCritico ?? producto.stock_minimo ?? 0} uds
              </span>
            </div>
            {isCritical && (
              <div className="mt-2.5 flex items-center gap-1.5 rounded bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/40 px-2 py-1 text-xs text-red-700 dark:text-red-400">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />
                <span>Nivel de stock bajo umbral crítico</span>
              </div>
            )}
          </div>

          {/* Tarjeta de Ubicación Física */}
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-mono">Ubicación en Pañol</span>
              <MapPin className="h-3.5 w-3.5 text-zinc-400" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {producto.ubicacion?.sala || 'Sala sin asignar'}
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs border-t border-zinc-100 dark:border-zinc-800 pt-2 font-mono">
              <span className="text-zinc-500 dark:text-zinc-400">Gaveta / Cajón:</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {producto.ubicacion?.cajon || 'Sin cajón'}
              </span>
            </div>
            {producto.ubicacion?.descripcion && (
              <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono line-clamp-2">
                {producto.ubicacion.descripcion}
              </p>
            )}
          </div>
        </div>

        {/* Metadatos de Creación / Auditoría */}
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono border-t border-zinc-200 dark:border-zinc-800 pt-2.5">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
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
          <span className="text-zinc-400 dark:text-zinc-500">SGIA · Pañol TI</span>
        </div>

        {/* Acciones de Pie */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrintLabel}
            className="flex items-center gap-1.5 text-xs"
          >
            <Printer className="h-3.5 w-3.5 text-zinc-500" />
            <span>Imprimir etiqueta térmica</span>
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
                <ArrowRightLeft className="h-3.5 w-3.5" />
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
                <Pencil className="h-3.5 w-3.5" />
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
