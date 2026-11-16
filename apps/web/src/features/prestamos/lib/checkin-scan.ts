import type { LoanCheckinItem, LoanCheckinPayload, Prestamo } from '@sgia/types';

/**
 * Devolución con escaneo (`BackEnd-SGIA/docs/codigos-ubicacion.md`): se escanea el producto
 * (cada unidad de un equipo/maqueta, o el código del insumo) y luego el cajón donde se guarda.
 * Lógica pura: el componente solo guarda el estado y llama a la API para resolver el cajón.
 */

export type ReturnTarget =
  | {
      kind: 'unit';
      key: string;
      itemId: number;
      productId: number;
      unitId: number;
      code: string;
      name: string;
    }
  | {
      kind: 'supply';
      key: string;
      itemId: number;
      productId: number;
      code: string;
      name: string;
      quantity: number;
      /** Cajón registrado del producto: la devolución debe guardarse ahí (si tiene). */
      registeredCajonId: number | null;
      registeredCajonCode: string | null;
    };

export type ReturnCondition = 'bueno' | 'dañado' | 'extraviado';

export interface ScannedCajon {
  id: number;
  code: string;
  storeroomId: number | null;
}

export interface ReturnEntry {
  target: ReturnTarget;
  /** `null` mientras espera el cajón, o si está extraviado. */
  cajon: ScannedCajon | null;
  condition: ReturnCondition;
  notes: string;
}

const norm = (code: string) => code.trim().toUpperCase();

/** Lo que aún falta devolver del préstamo: unidades pendientes e insumos no devueltos. */
export function pendingTargets(loan: Prestamo): ReturnTarget[] {
  const targets: ReturnTarget[] = [];
  for (const item of loan.items) {
    const itemId = Number(item.id);
    const productId = Number(item.productoId ?? item.product_id ?? 0);
    const name = item.nombre || item.productoNombre || `Producto #${productId}`;
    const units = item.units ?? [];

    if (units.length > 0) {
      for (const unit of units) {
        if (unit.returned_at) continue;
        targets.push({ kind: 'unit', key: `u${unit.id}`, itemId, productId, unitId: unit.id, code: unit.code, name });
      }
      continue;
    }

    const quantity = Number(item.cantidad ?? item.quantity ?? 1);
    if (Number(item.returned_quantity ?? 0) >= quantity) continue;
    targets.push({
      kind: 'supply',
      key: `i${itemId}`,
      itemId,
      productId,
      code: item.codigoBarras || '',
      name,
      quantity,
      registeredCajonId: item.cajon_id ?? null,
      registeredCajonCode: item.cajon_barcode ?? (item.cajon || null),
    });
  }
  return targets;
}

export type ProductScanResult =
  | { ok: true; target: ReturnTarget }
  | { ok: false; reason: 'already-scanned'; target: ReturnTarget }
  | { ok: false; reason: 'not-in-loan' };

/** Busca un código escaneado entre lo pendiente del préstamo (unidad o insumo). */
export function matchProductScan(rawCode: string, targets: ReturnTarget[], entries: ReturnEntry[]): ProductScanResult {
  const code = norm(rawCode);
  const target = targets.find((t) => t.code !== '' && norm(t.code) === code);
  if (!target) return { ok: false, reason: 'not-in-loan' };
  if (entries.some((e) => e.target.key === target.key)) return { ok: false, reason: 'already-scanned', target };
  return { ok: true, target };
}

/**
 * El cajón escaneado no sirve para este destino: texto del aviso, o `null` si es válido.
 * La regla del pañol vale solo para unidades: los insumos no se controlan por pañol y su cajón
 * registrado puede estar en otro pañol que el del préstamo.
 */
export function cajonProblem(target: ReturnTarget, cajon: ScannedCajon, loanStoreroomId: number | null | undefined): string | null {
  if (target.kind === 'unit' && loanStoreroomId && cajon.storeroomId && cajon.storeroomId !== loanStoreroomId) {
    return `El cajón ${cajon.code} no pertenece al pañol del préstamo.`;
  }
  if (target.kind === 'supply' && target.registeredCajonId !== null && target.registeredCajonId !== cajon.id) {
    const where = target.registeredCajonCode ? `el cajón ${target.registeredCajonCode}` : 'otro cajón';
    return `${target.name} se guarda en ${where}; escanea ese cajón o reubica el producto.`;
  }
  return null;
}

/** Entradas que aún no se pueden enviar: devueltas (no extraviadas) sin cajón escaneado. */
export function missingCajon(entries: ReturnEntry[]): ReturnEntry[] {
  return entries.filter((e) => e.condition !== 'extraviado' && e.cajon === null);
}

/**
 * Arma el cuerpo de `POST /api/loans/checkin`: una fila por ítem y condición. El detalle de los
 * daños va en `general_notes` (el backend no guarda notas por ítem).
 */
export function buildCheckinPayload(loanId: number, entries: ReturnEntry[], generalNotes: string): LoanCheckinPayload {
  const rows = new Map<string, LoanCheckinItem>();

  for (const entry of entries) {
    const { target, condition, cajon } = entry;
    const key = `${target.itemId}:${condition}`;
    const base: LoanCheckinItem = rows.get(key) ?? {
      item_id: target.itemId,
      condition,
      ...(condition === 'dañado' ? { damaged: true } : {}),
    };

    if (target.kind === 'unit') {
      base.units = [...(base.units ?? []), { id: target.unitId, ...(cajon ? { cajon_id: cajon.id } : {}) }];
    } else if (cajon) {
      base.cajon_id = cajon.id;
    }
    rows.set(key, base);
  }

  const damageNotes = entries
    .filter((e) => e.condition === 'dañado' && e.notes.trim())
    .map((e) => `Dañado ${e.target.name}${e.target.kind === 'unit' ? ` (${e.target.code})` : ''}: ${e.notes.trim()}`);
  const notes = [generalNotes.trim(), ...damageNotes].filter(Boolean).join('\n');

  return {
    loan_id: loanId,
    items: [...rows.values()],
    ...(notes ? { general_notes: notes } : {}),
  };
}
