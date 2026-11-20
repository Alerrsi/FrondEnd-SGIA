import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Map as MapIcon } from 'lucide-react';
import { useLocations, usePrefetchEstanteContenido, useSalaMapa } from '@sgia/api-client';
import type { Estante } from '@sgia/types';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/context/auth-context';
import { canAccessRoute } from '@/features/auth/types/roles';
import { apiErrorToMessage } from '@/lib/api-error';
import { EstanteContenidoDialog } from '../components/estante-contenido-dialog';
import { EstanteShape } from '../components/estante-shape';
import { EstantesList } from '../components/estantes-list';
import { SalaSelector } from '../components/sala-selector';
import { initialViewBox, SalaSvg } from '../components/sala-svg';
import { ZonaShape } from '../components/zona-shape';
import { useLastSala } from '../hooks/use-last-sala';
import { useMapScale } from '../hooks/use-map-scale';

const ZONE_LABEL_PX = 13;

/** Plano de una sala (REQ-22): muro, zonas y estantes; al pulsar un estante se ve lo que guarda. */
export default function MapaSalaPage() {
  const { locationId } = useParams();
  const salaId = Number(locationId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const canSeeInventory = role ? canAccessRoute(role, '/inventario') : false;

  const salas = useLocations({ per_page: 100 });
  const mapa = useSalaMapa(Number.isInteger(salaId) && salaId > 0 ? salaId : undefined);
  const { remember } = useLastSala();
  const prefetch = usePrefetchEstanteContenido();

  const svgRef = useRef<SVGSVGElement>(null);
  const width = mapa.data?.location.map_width_cm ?? 1000;
  const height = mapa.data?.location.map_height_cm ?? 600;
  const viewBox = useMemo(() => initialViewBox(width, height), [width, height]);
  const pxPerCm = useMapScale(svgRef, viewBox.w);

  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    if (mapa.data) remember(mapa.data.location.id);
  }, [mapa.data, remember]);

  const zonaNombre = useMemo(
    () => new Map((mapa.data?.zonas ?? []).map((zona) => [zona.id, zona.nombre])),
    [mapa.data?.zonas],
  );
  const openEstante = useCallback((estante: Estante) => setOpenId(estante.id), []);
  const prefetchEstante = useCallback((id: number) => void prefetch(id), [prefetch]);

  const sala = mapa.data?.location;
  const openCodigo = mapa.data?.estantes.find((estante) => estante.id === openId)?.codigo;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        icon={MapIcon}
        title="Mapa de salas"
        description={sala ? `${sala.code} · ${sala.nombre}: pulsa un estante para ver lo que guarda.` : 'Distribución de zonas y estantes de cada sala.'}
        actions={
          salas.data && salas.data.data.length > 0 ? (
            <SalaSelector salas={salas.data.data} value={salaId} onChange={(id) => navigate(`/mapa-salas/${id}`)} />
          ) : undefined
        }
      />

      {mapa.isLoading && <Skeleton label="Cargando el plano de la sala" className="aspect-[5/3] w-full" />}

      {mapa.isError && (
        <ErrorState action={<Button size="sm" variant="secondary" onClick={() => void mapa.refetch()}>Reintentar</Button>}>
          {apiErrorToMessage(mapa.error)}
        </ErrorState>
      )}

      {mapa.data && sala && (
        <>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950 sm:p-4">
            <SalaSvg
              ref={svgRef}
              label={sala.nombre}
              width={width}
              height={height}
              viewBox={viewBox}
              pxPerCm={pxPerCm}
              className="mx-auto block h-auto max-h-[70vh] w-full select-none"
              background={mapa.data.zonas.map((zona) => (
                <ZonaShape key={zona.id} zona={zona} fontSize={ZONE_LABEL_PX / pxPerCm} />
              ))}
            >
              {mapa.data.estantes.map((estante) => (
                <EstanteShape
                  key={estante.id}
                  estante={estante}
                  zonaNombre={estante.zona_id ? (zonaNombre.get(estante.zona_id) ?? null) : null}
                  pxPerCm={pxPerCm}
                  selected={estante.id === openId}
                  onActivate={openEstante}
                  onPrefetch={prefetchEstante}
                />
              ))}
            </SalaSvg>
          </div>

          <EstantesList estantes={mapa.data.estantes} zonas={mapa.data.zonas} onOpen={openEstante} />
        </>
      )}

      <EstanteContenidoDialog
        estanteId={openId}
        codigo={openCodigo}
        onClose={() => setOpenId(null)}
        canSeeInventory={canSeeInventory}
      />
    </div>
  );
}
