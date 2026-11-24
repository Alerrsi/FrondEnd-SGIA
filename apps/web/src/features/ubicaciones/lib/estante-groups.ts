import type { CajonEntity, Estante } from '@sgia/types';

import type { CajonVista } from '../components/cajon-row';

/** Clave del grupo de cajones sin estante en el panel. */
export const SIN_ESTANTE = 'sin-estante' as const;
export type GroupKey = number | typeof SIN_ESTANTE;

export interface EstanteGroup {
  key: GroupKey;
  /** `null` en el grupo «Sin estante». */
  estante: Estante | null;
  cajones: CajonVista[];
}

/**
 * Estantes del plano con sus cajones (docs/ubicaciones-distribucion.md, decisiones 11 y 12). Los cajones de cada
 * estante salen del plano, que viene completo y trae productos + unidades; la lista de cajones aporta la
 * descripción y los que no tienen estante (con `products_count`, sin unidades).
 */
export function buildEstanteGroups(
  estantes: Estante[],
  cajones: CajonEntity[],
  cajonCode: (cajon: Pick<CajonEntity, 'barcode' | 'codigo' | 'location'>) => string,
): EstanteGroup[] {
  const byId = new Map(cajones.map((cajon) => [cajon.id, cajon]));
  const enEstante = new Set<number>();

  const groups: EstanteGroup[] = estantes.map((estante) => ({
    key: estante.id,
    estante,
    cajones: estante.cajones.map((resumen) => {
      enEstante.add(resumen.id);
      const entity = byId.get(resumen.id);
      return {
        id: resumen.id,
        codigo: resumen.codigo,
        code: cajonCode({ barcode: resumen.barcode ?? entity?.barcode, codigo: resumen.codigo, location: entity?.location }),
        descripcion: entity?.descripcion ?? null,
        lleno: Boolean(resumen.lleno),
        elementos: resumen.products_count + resumen.units_count,
        estanteId: estante.id,
        estanteCodigo: estante.codigo,
      };
    }),
  }));

  const sueltos = cajones
    .filter((cajon) => !enEstante.has(cajon.id) && (cajon.estante_id ?? cajon.estante?.id ?? null) === null)
    .map<CajonVista>((cajon) => ({
      id: cajon.id,
      codigo: cajon.codigo,
      code: cajonCode(cajon),
      descripcion: cajon.descripcion ?? null,
      lleno: Boolean(cajon.lleno),
      elementos: cajon.products_count ?? null,
      estanteId: null,
      estanteCodigo: null,
    }));

  if (sueltos.length > 0) groups.push({ key: SIN_ESTANTE, estante: null, cajones: sueltos });
  return groups;
}

/**
 * Filtro de texto del panel: si coincide el estante (código o nombre) se muestra entero; si no, solo sus cajones que
 * coinciden (código, código completo o descripción). Los grupos sin coincidencias se quitan.
 */
export function filterEstanteGroups(groups: EstanteGroup[], term: string): EstanteGroup[] {
  const q = term.trim().toLowerCase();
  if (!q) return groups;
  const has = (value: string | null | undefined) => Boolean(value?.toLowerCase().includes(q));
  return groups.flatMap((group) => {
    if (group.estante && (has(group.estante.codigo) || has(group.estante.nombre))) return [group];
    const cajones = group.cajones.filter((cajon) => has(cajon.codigo) || has(cajon.code) || has(cajon.descripcion));
    return cajones.length > 0 ? [{ ...group, cajones }] : [];
  });
}
