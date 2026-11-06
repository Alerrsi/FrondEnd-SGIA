import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/lib/format';
import { useCotizaciones } from '@sgia/api-client';
import type { Cotizacion } from '@sgia/types';
import { AlertCircle, ClipboardList, FileText, Plus } from 'lucide-react';

import { QuotationStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CotizacionFormDialog } from '@/features/cotizaciones/components/cotizacion-form-dialog';
import { CotizacionDetailSheet } from '@/features/cotizaciones/components/cotizacion-detail-sheet';

export default function CotizacionesPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCotizaciones({ page: 1, perPage: 20 });

  const [formOpen, setFormOpen] = useState(false);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);

  const handleGenerateOrder = (cotizacion: Cotizacion) => {
    setSelectedCotizacion(null);
    navigate(`/compras?cotizacion=${cotizacion.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs font-mono text-text-muted py-12 justify-center">
        <span>Cargando historial de cotizaciones…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger-bg p-4 text-xs font-medium text-danger">
        <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0 text-danger" />
        <span>No se pudo cargar el historial de cotizaciones desde el servidor.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span data-sede-badge="true" className="sede-badge inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-2 py-0.5 text-xs font-mono font-medium text-brand-strong">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            SEDE TEMUCO · ADQUISICIONES
          </span>
          <span className="text-text-muted text-xs font-mono">/</span>
          <span className="font-mono text-xs text-text-muted uppercase tracking-wider">
            Cotizaciones
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
              <ClipboardList aria-hidden="true" className="h-5 w-5 text-text" />
              Cotizaciones a Proveedores
            </h1>
            <p className="text-xs text-text-muted">
              Gestión y seguimiento de cotizaciones y adquisiciones de insumos (REQ-07 / REQ-08).
            </p>
          </div>
          <Button variant="primary" onClick={() => setFormOpen(true)} className="text-xs">
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nueva cotización
          </Button>
        </div>
      </div>

      {/* Cotizaciones list */}
      <div className="flex flex-col gap-3">
        {data.data.length === 0 && (
          <div className="rounded-lg border border-border bg-surface p-8 text-center text-xs text-text-muted">
            No hay cotizaciones registradas actualmente. Emite una nueva cotización seleccionando
            productos y al menos 1 proveedor.
          </div>
        )}
        {data.data.map((cotizacion) => (
          <Card
            key={cotizacion.id}
            className="flex items-center justify-between gap-4 cursor-pointer hover:border-text-muted transition-colors"
            onClick={() => setSelectedCotizacion(cotizacion)}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <FileText aria-hidden="true" className="h-3.5 w-3.5 text-text-muted" />
                <span className="font-mono text-xs font-bold text-text">
                  #{cotizacion.id}
                </span>
              </div>
              <span className="text-xs text-text-muted">
                {cotizacion.proveedor ?? 'Múltiples proveedores'} · {cotizacion.items.length} ítems
              </span>
              {cotizacion.createdAt && (
                <span className="text-xs font-mono text-text-muted">
                  {formatDate(cotizacion.createdAt)}
                </span>
              )}
            </div>
            <QuotationStatusBadge estado={cotizacion.estado} />
          </Card>
        ))}
      </div>

      {/* New Cotización Dialog */}
      <CotizacionFormDialog open={formOpen} onClose={() => setFormOpen(false)} />

      {/* Cotización Detail Sheet */}
      <CotizacionDetailSheet
        open={selectedCotizacion !== null}
        onClose={() => setSelectedCotizacion(null)}
        cotizacion={selectedCotizacion}
        onGenerateOrder={handleGenerateOrder}
      />
    </div>
  );
}
