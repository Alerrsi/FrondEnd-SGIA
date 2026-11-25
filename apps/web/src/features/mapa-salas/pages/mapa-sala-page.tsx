import { useNavigate, useParams } from 'react-router-dom';
import { Map as MapIcon } from 'lucide-react';
import { useLocations } from '@sgia/api-client';

import { ExportExcelButton } from '@/components/shared/export-excel-button';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/features/auth/context/auth-context';
import { canAccessRoute, canDo } from '@/features/auth/types/roles';
import { SalaMapaPanel } from '../components/sala-mapa-panel';
import { SalaSelector } from '../components/sala-selector';
import { useLastSala } from '../hooks/use-last-sala';

/**
 * `/mapa-salas/:locationId` (REQ-22), para `DIR-01` (edita) y `AD-01` (solo mira). El pañolero ve el mapa en Ubicaciones.
 */
export default function MapaSalaPage() {
  const { locationId } = useParams();
  const parsed = Number(locationId);
  const salaId = Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const salas = useLocations({ per_page: 100 });
  const { remember } = useLastSala();
  const sala = salas.data?.data.find((item) => item.id === salaId);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={MapIcon}
        title="Mapa de salas"
        description={sala ? `${sala.code} · ${sala.nombre}: pulsa un estante para ver lo que guarda.` : 'Distribución de zonas y estantes de cada sala.'}
        actions={
          salas.data && salas.data.data.length > 0 ? (
            <>
              {/* Dónde está cada cosa en la sala abierta (docs/reportes-excel.md, ampliación A1). */}
              {salaId > 0 && <ExportExcelButton path="/locations/export" params={{ location_id: salaId }} filenamePrefix="ubicaciones" />}
              <SalaSelector salas={salas.data.data} value={salaId} onChange={(id) => navigate(`/mapa-salas/${id}`)} />
            </>
          ) : undefined
        }
      />
      <SalaMapaPanel
        locationId={salaId}
        canEdit={canDo(role, 'editRoomMap')}
        canSeeInventory={role ? canAccessRoute(role, '/inventario') : false}
        onLoaded={remember}
      />
    </div>
  );
}
