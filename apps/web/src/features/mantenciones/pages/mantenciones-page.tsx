import { useState } from 'react';
import { useEquipmentUnits, useMaintenanceSummary } from '@sgia/api-client';
import { Wrench } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { MaintenanceCareerGrid } from '@/features/mantenciones/components/maintenance-career-grid';
import { MaintenanceChecklistSheet } from '@/features/mantenciones/components/maintenance-checklist-sheet';
import { MaintenanceDueNotice } from '@/features/mantenciones/components/maintenance-due-notice';
import { MaintenanceInbox } from '@/features/mantenciones/components/maintenance-inbox';
import { MaintenanceMetrics } from '@/features/mantenciones/components/maintenance-metrics';
import type { CareerFilter } from '@/features/mantenciones/lib/career-filter';

/**
 * Mantenciones (REQ-18, docs/mantenciones-por-carrera.md): cifras, unidades vencidas, una celda por carrera con su
 * desglose por estado (tocarla filtra la bandeja) y la bandeja por prioridad.
 */
export default function MantencionesPage() {
  const [params] = useSearchParams();
  const [career, setCareer] = useState<CareerFilter>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const showDue = params.get('vencidas') === '1';

  const summary = useMaintenanceSummary();
  const due = useEquipmentUnits({ maintenance_due: true, per_page: 10 });
  const dueTotal = due.data?.meta.total;

  const toggleCareer = (filter: Exclude<CareerFilter, null>) => {
    setCareer((current) => (current === filter ? null : filter));
    // En pantallas angostas la bandeja queda abajo de las carreras: se lleva a la vista para que se note el filtro.
    if (typeof window !== 'undefined' && window.matchMedia?.('(max-width: 1023px)').matches) {
      document.getElementById('bandeja')?.scrollIntoView({ block: 'start' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Wrench}
        title="Mantenciones"
        description="Equipos en revisión por carrera y bandeja por prioridad."
      />

      {summary.isLoading ? (
        <Skeleton label="Cargando resumen de mantenciones…" className="h-64 w-full" />
      ) : summary.isError || !summary.data ? (
        <ErrorState action={<Button size="sm" variant="secondary" onClick={() => void summary.refetch()}>Reintentar</Button>}>
          No se pudo cargar el resumen por carrera.
        </ErrorState>
      ) : (
        <MaintenanceMetrics total={summary.data.total} due={dueTotal} />
      )}

      {(showDue || (dueTotal ?? 0) > 0) && <MaintenanceDueNotice total={dueTotal ?? 0} units={due.data?.data ?? []} />}

      {summary.data && <MaintenanceCareerGrid careers={summary.data.careers} selected={career} onToggle={toggleCareer} />}

      <MaintenanceInbox careers={summary.data?.careers ?? []} career={career} onCareerChange={setCareer} onOpen={setOpenId} />

      <MaintenanceChecklistSheet recordId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
