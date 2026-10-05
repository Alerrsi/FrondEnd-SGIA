import { useProductBarcode } from '@sgia/api-client';
import type { Producto } from '@sgia/types';
import {
  AlertTriangle,
  Barcode,
  Calendar,
  Copy,
  Loader2,
  MapPin,
  Pencil,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

export function ProductoDetailDialog({
  open,
  onClose,
  producto,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  producto: Producto | null;
  onEdit?: (producto: Producto) => void;
}) {
  const { data: barcodeData, isLoading: isBarcodeLoading } = useProductBarcode(
    open && producto ? producto.id : undefined,
  );

  if (!producto) return null;

  const handleCopyBarcode = () => {
    const code = producto.codigoBarras || producto.barcode;
    if (code) {
      navigator.clipboard.writeText(code);
      toast.success('Código copiado al portapapeles');
    }
  };

  const handlePrintLabel = () => {
    const code = producto.codigoBarras || producto.barcode || 'SIN-CODIGO';
    const svgContent = barcodeData?.svg || '';
    const printWindow = window.open('', '_blank', 'width=450,height=350');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión');
      return;
    }

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
              font-weight: bold;
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
          <div class="code-text">${code}</div>
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
  };

  const isCritical = producto.stock <= producto.stockCritico;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Ficha técnica de inventario"
      description={`Detalles completos del producto y etiqueta para pañol · ID #${producto.id}`}
      className="max-w-xl"
    >
      <div className="flex flex-col gap-4">
        {/* Header con nombre y badges */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 className="text-base font-semibold text-text">{producto.nombre}</h2>
            {producto.description && (
              <p className="mt-1 text-xs text-text-muted">{producto.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {producto.area && <Badge tone="neutral">{producto.area}</Badge>}
            {producto.activo ? (
              <Badge tone="success">Activo</Badge>
            ) : (
              <Badge tone="danger">Inactivo</Badge>
            )}
          </div>
        </div>

        {/* Sección de Código de Barras Vectorial */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-raised/40 p-4">
          <div className="mb-2 flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-text">
              <Barcode className="h-4 w-4 text-accent" />
              Código de Barra Code128 (Lectura óptica)
            </span>
            <button
              type="button"
              onClick={handleCopyBarcode}
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text"
              title="Copiar código"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copiar</span>
            </button>
          </div>

          {/* Contenedor del código de barra: fondo blanco puro para óptima lectura de pistola */}
          <div
            data-testid="barcode-container"
            className="flex min-h-[90px] w-full max-w-sm flex-col items-center justify-center rounded-lg bg-white p-3 text-black shadow-inner"
          >
            {isBarcodeLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-500 font-mono-tabular">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <span>Generando código de barras vectorial…</span>
              </div>
            ) : barcodeData?.svg ? (
              <div
                data-testid="barcode-svg"
                className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-14"
                dangerouslySetInnerHTML={{ __html: barcodeData.svg }}
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-500">
                <Barcode className="h-8 w-8 opacity-40" />
                <span className="text-[11px] font-mono-tabular">SVG no disponible</span>
              </div>
            )}
            <span className="mt-1 font-mono-tabular text-xs font-bold tracking-widest text-black">
              {producto.codigoBarras || producto.barcode || 'SIN-CODIGO'}
            </span>
          </div>

          <p className="mt-2 text-[11px] text-text-muted">
            Optimizado para lectores de pistola USB / Bluetooth en módulo de préstamos presenciales.
          </p>
        </div>

        {/* Métricas clave: Stock y Ubicación */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Stock */}
          <div className="rounded-lg border border-border bg-surface p-3">
            <span className="text-xs text-text-muted">Control de Stock</span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono-tabular text-2xl font-bold text-text">
                {producto.stock}
              </span>
              <span className="text-xs text-text-muted">unidades disponibles</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-text-muted">Stock mínimo crítico:</span>
              <span className="font-mono-tabular font-medium text-text">
                {producto.stockCritico} uds
              </span>
            </div>
            {isCritical && (
              <div className="mt-2 flex items-center gap-1.5 rounded bg-danger/10 px-2 py-1 text-[11px] text-danger">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Nivel de stock bajo el umbral mínimo</span>
              </div>
            )}
          </div>

          {/* Ubicación física */}
          <div className="rounded-lg border border-border bg-surface p-3">
            <span className="text-xs text-text-muted">Ubicación física en Pañol</span>
            <div className="mt-1.5 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-text">
                {producto.ubicacion?.sala || 'Sala sin asignar'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-text-muted">Cajón / Estante:</span>
              <span className="font-mono-tabular font-medium text-text">
                {producto.ubicacion?.cajon || 'Sin cajón'}
              </span>
            </div>
            {producto.ubicacion?.descripcion && (
              <p className="mt-2 text-[11px] text-text-muted">
                {producto.ubicacion.descripcion}
              </p>
            )}
          </div>
        </div>

        {/* Fecha de alta */}
        <div className="flex items-center justify-between text-xs text-text-muted border-t border-border pt-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Registrado el{' '}
              {producto.createdAt
                ? new Date(producto.createdAt).toLocaleDateString('es-CL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'}
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handlePrintLabel}
            className="flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir etiqueta térmica</span>
          </Button>

          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  onClose();
                  onEdit(producto);
                }}
                className="flex items-center gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Editar producto</span>
              </Button>
            )}
            <Button type="button" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
