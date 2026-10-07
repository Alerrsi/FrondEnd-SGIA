import { useState } from 'react';
import {
  Clock,
  Cpu,
  Download,
  Edit,
  ExternalLink,
  FileText,
  FileCheck2,
  HardDrive,
  Layers,
  MapPin,
  Wrench,
  Loader2,
} from 'lucide-react';
import type { Equipo, EquipmentStatus } from '@sgia/types';
import {
  useDownloadEquipmentReports,
  useDownloadTechnicalSheet,
} from '@sgia/api-client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge, type Tone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { calculateEquipmentLifeCycle } from '../utils/lifecycle';
import { downloadBlob } from '../utils/download';

interface EquipmentSpecSheetProps {
  open: boolean;
  onClose: () => void;
  equipo: Equipo | null;
  canEdit?: boolean;
  onOpenEdit?: (equipo: Equipo) => void;
}

export function EquipmentSpecSheet({
  open,
  onClose,
  equipo,
  canEdit = false,
  onOpenEdit,
}: EquipmentSpecSheetProps) {
  const [downloadingSheet, setDownloadingSheet] = useState(false);
  const [downloadingReports, setDownloadingReports] = useState(false);

  const downloadSheetMutation = useDownloadTechnicalSheet();
  const downloadReportsMutation = useDownloadEquipmentReports();

  if (!equipo) return null;

  const rawStatus = (equipo.estado ?? equipo.status ?? 'operativo') as EquipmentStatus;
  const statusToneMap: Record<EquipmentStatus, Tone> = {
    operativo: 'available',
    en_mantencion: 'maintenance',
    critico: 'critical',
    baja: 'retired',
    en_prestamo: 'loaned',
  };
  const statusLabelMap: Record<EquipmentStatus, string> = {
    operativo: 'Operativo',
    en_mantencion: 'En Mantención',
    critico: 'Falla Crítica',
    baja: 'Dado de Baja',
    en_prestamo: 'En Préstamo',
  };

  const pDate = equipo.purchase_date ?? equipo.specs?.purchase_date;
  const lYears = equipo.lifespan_years ?? equipo.specs?.lifespan_years;
  const manualUrl = equipo.user_manual_url ?? equipo.specs?.user_manual_url;

  const lifeCycle = calculateEquipmentLifeCycle(pDate, lYears);
  const specs = equipo.specs?.specifications ?? {};
  const specEntries = Object.entries(specs);

  const handleDownloadSheet = async () => {
    try {
      setDownloadingSheet(true);
      const blob = await downloadSheetMutation.mutateAsync(equipo.id);
      const filename = `ficha-tecnica-${equipo.codigo || `eq-${equipo.id}`}.pdf`;
      downloadBlob(blob, filename);
      toast.success('Ficha técnica descargada correctamente');
    } catch {
      toast.error('Error al generar la ficha técnica en PDF');
    } finally {
      setDownloadingSheet(false);
    }
  };

  const handleDownloadReports = async () => {
    try {
      setDownloadingReports(true);
      const blob = await downloadReportsMutation.mutateAsync(equipo.id);
      const filename = `hoja-vida-mantenciones-${equipo.codigo || `eq-${equipo.id}`}.pdf`;
      downloadBlob(blob, filename);
      toast.success('Historial y hoja de vida descargados correctamente');
    } catch {
      toast.error('Error al descargar el informe de mantenciones en PDF');
    } finally {
      setDownloadingReports(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="overflow-y-auto max-w-xl w-full flex flex-col gap-6"
      >
        {/* Cabecera Técnica del Drawer */}
        <SheetHeader className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold tracking-wide">
              {equipo.codigo || equipo.sku || `ID: ${equipo.id}`}
            </span>
            <Badge tone={statusToneMap[rawStatus] || 'neutral'} dot>
              {statusLabelMap[rawStatus] || rawStatus}
            </Badge>
          </div>

          <SheetTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {equipo.nombre}
          </SheetTitle>

          <SheetDescription className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-3 mt-1">
            {(equipo.marca || equipo.modelo) && (
              <span className="flex items-center gap-1">
                <HardDrive className="h-3.5 w-3.5 text-zinc-400" />
                <span>
                  {[equipo.marca, equipo.modelo].filter(Boolean).join(' · ')}
                </span>
              </span>
            )}
            {equipo.categoria && (
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-zinc-400" />
                <span>{equipo.categoria}</span>
              </span>
            )}
            {equipo.ubicacion && (
              <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                <span>{equipo.ubicacion}</span>
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        {/* Acciones Rápidas de Descarga y Edición */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadSheet}
            disabled={downloadingSheet}
            className="flex-1 min-w-[150px] text-xs gap-1.5"
            aria-label="Descargar Ficha Técnica PDF"
          >
            {downloadingSheet ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>Ficha Técnica (PDF)</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadReports}
            disabled={downloadingReports}
            className="flex-1 min-w-[150px] text-xs gap-1.5"
            aria-label="Descargar Hoja de Vida Mantenciones PDF"
          >
            {downloadingReports ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileCheck2 className="h-3.5 w-3.5" />
            )}
            <span>Hoja de Vida (PDF)</span>
          </Button>

          {canEdit && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onOpenEdit?.(equipo)}
              className="text-xs gap-1.5"
              aria-label="Editar Especificaciones"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Editar</span>
            </Button>
          )}
        </div>

        {/* Sección: Ciclo de Vida y Obsolescencia */}
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              <Clock className="h-4 w-4 text-zinc-400" />
              <span>Ciclo de Vida y Vida Útil Estimada</span>
            </h4>
            <Badge tone={lifeCycle.statusTone} dot>
              {lifeCycle.statusLabel}
            </Badge>
          </div>

          {/* Barra de progreso de ciclo de vida */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Desgaste operativo:</span>
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {lifeCycle.percentUsed}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  lifeCycle.percentUsed >= 90
                    ? 'bg-rose-500'
                    : lifeCycle.percentUsed >= 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${lifeCycle.percentUsed}%` }}
              />
            </div>
          </div>

          {/* Desglose de Parámetros de Ciclo de Vida */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-zinc-400">Adquisición</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200 mt-0.5">
                {lifeCycle.purchaseDateFormatted}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-zinc-400">Vida Proyectada</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200 mt-0.5">
                {lifeCycle.lifespanYears} años
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-zinc-400">Antigüedad</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200 mt-0.5">
                {lifeCycle.ageYears} años
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-zinc-400">Restante</span>
              <span
                className={`font-mono font-bold mt-0.5 ${
                  lifeCycle.isCritical
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-zinc-800 dark:text-zinc-200'
                }`}
              >
                {lifeCycle.remainingYears} años
              </span>
            </div>
          </div>
        </div>

        {/* Sección: Manual Oficial de Usuario en AWS S3 */}
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            <FileText className="h-4 w-4 text-zinc-400" />
            <span>Manual Oficial de Usuario (S3 / Cloud)</span>
          </h4>

          {manualUrl ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2.5 mt-1">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="h-4 w-4 text-red-600 shrink-0" />
                <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate">
                  {manualUrl}
                </span>
              </div>
              <a
                href={manualUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
              >
                <span>Abrir PDF</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 py-2">
              <span className="italic">Manual de usuario no vinculado en almacenamiento en la nube.</span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onOpenEdit?.(equipo)}
                  className="text-red-600 dark:text-red-400 font-medium hover:underline"
                >
                  Vincular URL
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sección: Especificaciones Técnicas Detalladas */}
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              <Cpu className="h-4 w-4 text-zinc-400" />
              <span>Especificaciones Técnicas</span>
            </h4>
            {canEdit && (
              <button
                type="button"
                onClick={() => onOpenEdit?.(equipo)}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1"
              >
                <Edit className="h-3 w-3" />
                <span>Editar</span>
              </button>
            )}
          </div>

          {specEntries.length === 0 ? (
            <div className="py-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
              No se han registrado parámetros de hardware para este equipo.
            </div>
          ) : (
            <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800 mt-1">
              {specEntries.map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-zinc-600 dark:text-zinc-400">
                    {key}
                  </span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold text-right">
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección: Historial de Mantenciones y Hoja de Vida */}
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            <Wrench className="h-4 w-4 text-zinc-400" />
            <span>Historial de Mantenciones e Intervenciones</span>
          </h4>

          {equipo.maintenances && equipo.maintenances.length > 0 ? (
            <div className="flex flex-col gap-2 mt-1 divide-y divide-zinc-100 dark:divide-zinc-800">
              {equipo.maintenances.map((m) => (
                <div key={m.id} className="pt-2 first:pt-0 flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                      {m.type} · {m.technician}
                    </span>
                    <span className="font-mono text-zinc-400">{m.date}</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400">{m.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
              No hay registros de mantenciones o calibraciones pendientes.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
