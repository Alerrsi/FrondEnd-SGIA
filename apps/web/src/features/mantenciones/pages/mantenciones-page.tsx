import { useState } from 'react';
import { useEquipmentUnits, useMaintenanceSummary } from '@sgia/api-client';
import { Wrench } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { MaintenanceStatus, MaintenanceType } from '@sgia/types';

import { ExportExcelButton } from '@/components/shared/export-excel-button';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { MaintenanceCareerList } from '@/features/mantenciones/components/maintenance-career-list';
import { MaintenanceChecklistSheet } from '@/features/mantenciones/components/maintenance-checklist-sheet';
import { MaintenanceDueNotice } from '@/features/mantenciones/components/maintenance-due-notice';
import { MaintenanceInbox } from '@/features/mantenciones/components/maintenance-inbox';
import { MaintenanceMetrics } from '@/features/mantenciones/components/maintenance-metrics';
import { careerFilterParams, type CareerFilter } from '@/features/mantenciones/lib/career-filter';

/**
 * Mantenciones (REQ-18, docs/mantenciones-por-carrera.md): franja de cifras, unidades vencidas y, debajo, la lista
 * «Por carrera» (elegir una filtra la bandeja) junto a la bandeja por prioridad. Solo neutros y burdeo.
 */
export default function MantencionesPage() {
  const [params] = useSearchParams();
  const [career, setCareer] = useState<CareerFilter>(null);
  const [status, setStatus] = useState<MaintenanceStatus | ''>('en_curso');
  const [type, setType] = useState<MaintenanceType | ''>('');
  const [openId, setOpenId] = useState<number | null>(null);
  const showDue = params.get('vencidas') === '1';

  const summary = useMaintenanceSummary();
  const due = useEquipmentUnits({ maintenance_due: true, per_page: 10 });
  const dueTotal = due.data?.meta.total;

  const selectCareer = (filter: CareerFilter) => {
    setCareer(filter);
    // Bajo 1024 px la bandeja queda abajo de la lista: se lleva a la vista para que se note el filtro.
    if (filter !== null && typeof window !== 'undefined' && window.matchMedia?.('(max-width: 1023px)').matches) {
      document.getElementById('bandeja')?.scrollIntoView({ block: 'start' });
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <PageHeader
        icon={Wrench}
        title="Mantenciones"
        description="Equipos en revisión por carrera y bandeja por prioridad."
        actions={
          <ExportExcelButton
            path="/maintenance-records/export"
            params={{ status: status || undefined, maintenance_type: type || undefined, ...careerFilterParams(career) }}
            filenamePrefix="mantenciones"
          />
        }
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

      <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        {summary.data && (
          <MaintenanceCareerList
            careers={summary.data.careers}
            total={summary.data.total.total}
            selected={career}
            onSelect={selectCareer}
            className="lg:sticky lg:top-4"
          />
        )}
        <MaintenanceInbox
          careers={summary.data?.careers ?? []}
          career={career}
          onCareerChange={setCareer}
          status={status}
          onStatusChange={setStatus}
          type={type}
          onTypeChange={setType}
          onOpen={setOpenId}
        />
      </div>

      <MaintenanceChecklistSheet recordId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
