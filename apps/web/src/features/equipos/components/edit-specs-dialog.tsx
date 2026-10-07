import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, X, ExternalLink } from 'lucide-react';
import type { Equipo, UpdateEquipmentSpecsPayload } from '@sgia/types';
import { useUpdateEquipmentSpecs } from '@sgia/api-client';

import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

interface EditSpecsDialogProps {
  open: boolean;
  onClose: () => void;
  equipo: Equipo | null;
}

interface SpecRow {
  key: string;
  value: string;
}

export function EditSpecsDialog({ open, onClose, equipo }: EditSpecsDialogProps) {
  const [purchaseDate, setPurchaseDate] = useState('');
  const [lifespanYears, setLifespanYears] = useState(5);
  const [manualUrl, setManualUrl] = useState('');
  const [specRows, setSpecRows] = useState<SpecRow[]>([]);

  const updateSpecsMutation = useUpdateEquipmentSpecs();

  useEffect(() => {
    if (equipo) {
      const pDate = equipo.purchase_date ?? equipo.specs?.purchase_date ?? '';
      setPurchaseDate(pDate ? (pDate.split('T')[0] ?? '') : '');
      setLifespanYears(equipo.lifespan_years ?? equipo.specs?.lifespan_years ?? 5);
      setManualUrl(equipo.user_manual_url ?? equipo.specs?.user_manual_url ?? '');

      const specsObj = equipo.specs?.specifications ?? {};
      const rows: SpecRow[] = Object.entries(specsObj).map(([k, v]) => ({
        key: k,
        value: String(v ?? ''),
      }));

      // Si no tiene especificaciones registradas, sugerir las básicas del área de pañol TI
      if (rows.length === 0) {
        setSpecRows([
          { key: 'Procesador / Chipset', value: '' },
          { key: 'Memoria RAM / Búfer', value: '' },
          { key: 'Puertos / Conectividad', value: '' },
          { key: 'Potencia / Consumo', value: '' },
          { key: 'Voltaje de Operación', value: '220V AC / 50Hz' },
        ]);
      } else {
        setSpecRows(rows);
      }
    }
  }, [equipo, open]);

  const handleAddRow = () => {
    setSpecRows((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveRow = (index: number) => {
    setSpecRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: 'key' | 'value', val: string) => {
    setSpecRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: val } : row)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipo) return;

    // Convert specRows to Record
    const specifications: Record<string, string | number | boolean> = {};
    for (const row of specRows) {
      const trimmedKey = row.key.trim();
      if (trimmedKey) {
        specifications[trimmedKey] = row.value.trim();
      }
    }

    const payload: UpdateEquipmentSpecsPayload = {
      specifications,
      purchase_date: purchaseDate || null,
      lifespan_years: Number(lifespanYears) || 5,
      user_manual_url: manualUrl.trim() || null,
    };

    try {
      await updateSpecsMutation.mutateAsync({
        id: equipo.id,
        payload,
      });
      toast.success('Especificaciones técnicas actualizadas correctamente');
      onClose();
    } catch {
      toast.error('Error al guardar las especificaciones técnicas del equipo');
    }
  };

  if (!equipo) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Editar Ficha Técnica y Especificaciones"
      description={`Modificando parámetros técnicos y ciclo de vida para ${equipo.nombre} (${equipo.codigo ?? `ID: ${equipo.id}`})`}
      className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2">
        {/* Parámetros de Ciclo de Vida y Almacenamiento S3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 p-3.5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-purchase-date"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
            >
              Fecha de Adquisición
            </label>
            <input
              id="edit-purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-lifespan"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
            >
              Vida Útil Proyectada (Años)
            </label>
            <input
              id="edit-lifespan"
              type="number"
              min={1}
              max={30}
              value={lifespanYears}
              onChange={(e) => setLifespanYears(Number(e.target.value))}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="edit-manual-url"
                className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
              >
                URL del Manual de Usuario (PDF en AWS S3 / Cloud Storage)
              </label>
              {manualUrl && (
                <a
                  href={manualUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 underline"
                >
                  <ExternalLink className="h-3 w-3" /> Probar enlace
                </a>
              )}
            </div>
            <input
              id="edit-manual-url"
              type="url"
              placeholder="https://sgia-assets.s3.amazonaws.com/manuals/cisco-catalyst.pdf"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
        </div>

        {/* Tabla de Especificaciones Clave / Valor Dinámicas */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Especificaciones Técnicas Detalladas
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="h-7 text-xs gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Agregar parámetro</span>
            </Button>
          </div>

          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
            {specRows.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
                No hay especificaciones definidas. Haz clic en "Agregar parámetro" para registrar características técnicas.
              </div>
            ) : (
              specRows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2">
                  <input
                    type="text"
                    placeholder="Parámetro (ej: Potencia, Puertos)"
                    value={row.key}
                    onChange={(e) => handleRowChange(idx, 'key', e.target.value)}
                    className="flex-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/40 px-2.5 py-1 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:border-zinc-400 focus:outline-none"
                    aria-label={`Nombre de parámetro ${idx + 1}`}
                  />
                  <input
                    type="text"
                    placeholder="Valor (ej: 48x GbE PoE+ 370W)"
                    value={row.value}
                    onChange={(e) => handleRowChange(idx, 'value', e.target.value)}
                    className="flex-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-400 focus:outline-none"
                    aria-label={`Valor de parámetro ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    title="Eliminar parámetro"
                    aria-label={`Eliminar parámetro ${row.key || idx + 1}`}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Botones de acción modal */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={updateSpecsMutation.isPending}
          >
            <X className="h-4 w-4" />
            <span>Cancelar</span>
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={updateSpecsMutation.isPending}
            className="gap-1.5"
          >
            <Save className="h-4 w-4" />
            <span>{updateSpecsMutation.isPending ? 'Guardando...' : 'Guardar Ficha Técnica'}</span>
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
