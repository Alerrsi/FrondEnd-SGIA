import { describe, expect, it } from 'vitest';
import type { Prestamo } from '@sgia/types';

import {
  buildCheckinPayload,
  cajonProblem,
  matchProductScan,
  missingCajon,
  pendingTargets,
  type ReturnEntry,
  type ReturnTarget,
} from './lib/checkin-scan';

const loan = {
  id: 164,
  storeroom_id: 1,
  items: [
    {
      id: 501,
      productoId: 8,
      nombre: 'Proyector Epson',
      cantidad: 3,
      units: [
        { id: 31, code: 'EQP-II-000031', status: 'prestado', returned_at: null },
        { id: 32, code: 'EQP-II-000032', status: 'prestado', returned_at: null },
        { id: 33, code: 'EQP-II-000033', status: 'disponible', returned_at: '2026-11-15T10:00:00Z' },
      ],
    },
    { id: 503, productoId: 15, nombre: 'Cable UTP', cantidad: 2, codigoBarras: 'INS-IC-000015', cajon_id: 1, cajon_barcode: 'PCENTRAL-CAJON-A1', returned_quantity: 0 },
    { id: 504, productoId: 17, nombre: 'Pasta térmica', cantidad: 1, codigoBarras: 'INS-IC-000017', cajon_id: null, returned_quantity: 0 },
    { id: 505, productoId: 18, nombre: 'Estaño', cantidad: 1, codigoBarras: 'INS-IC-000018', returned_quantity: 1 },
  ],
} as unknown as Prestamo;

const targets = pendingTargets(loan);
const byCode = (code: string) => targets.find((t) => t.code === code) as ReturnTarget;
const entry = (code: string, extra: Partial<ReturnEntry> = {}): ReturnEntry => ({
  target: byCode(code),
  cajon: null,
  condition: 'bueno',
  notes: '',
  ...extra,
});

describe('pendingTargets', () => {
  it('lista unidades pendientes e insumos no devueltos', () => {
    expect(targets.map((t) => t.code)).toEqual(['EQP-II-000031', 'EQP-II-000032', 'INS-IC-000015', 'INS-IC-000017']);
    const cable = byCode('INS-IC-000015');
    expect(cable.kind === 'supply' && cable.registeredCajonCode).toBe('PCENTRAL-CAJON-A1');
  });
});

describe('matchProductScan', () => {
  it('reconoce una unidad sin distinguir mayúsculas', () => {
    const r = matchProductScan(' eqp-ii-000032 ', targets, []);
    expect(r.ok && r.target.kind === 'unit' && r.target.unitId).toBe(32);
  });

  it('rechaza un código ajeno al préstamo o ya devuelto', () => {
    expect(matchProductScan('EQP-II-000033', targets, [])).toEqual({ ok: false, reason: 'not-in-loan' });
    expect(matchProductScan('OTRO-123', targets, [])).toEqual({ ok: false, reason: 'not-in-loan' });
  });

  it('avisa si ya se escaneó', () => {
    const r = matchProductScan('EQP-II-000031', targets, [entry('EQP-II-000031')]);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toBe('already-scanned');
  });
});

describe('cajonProblem', () => {
  const cajonA1 = { id: 1, code: 'PCENTRAL-CAJON-A1', storeroomId: 1 };
  const rack = { id: 9, code: 'PREDES-RACK-R1', storeroomId: 2 };
  const gaveta = { id: 3, code: 'PCENTRAL-GAVETA-01', storeroomId: 1 };

  it('acepta el cajón registrado del insumo y cualquier cajón del pañol para una unidad', () => {
    expect(cajonProblem(byCode('INS-IC-000015'), cajonA1, 1)).toBeNull();
    expect(cajonProblem(byCode('EQP-II-000031'), gaveta, 1)).toBeNull();
    expect(cajonProblem(byCode('INS-IC-000017'), gaveta, 1)).toBeNull();
  });

  it('rechaza otro cajón para un insumo con cajón registrado', () => {
    expect(cajonProblem(byCode('INS-IC-000015'), gaveta, 1)).toBe(
      'Cable UTP se guarda en el cajón PCENTRAL-CAJON-A1; escanea ese cajón o reubica el producto.',
    );
  });

  it('rechaza un cajón de otro pañol', () => {
    expect(cajonProblem(byCode('EQP-II-000031'), rack, 1)).toBe('El cajón PREDES-RACK-R1 no pertenece al pañol del préstamo.');
  });
});

describe('buildCheckinPayload', () => {
  const cajon = (id: number) => ({ id, code: `C${id}`, storeroomId: 1 });

  it('agrupa por ítem y condición, extraviada sin cajón y daños en las notas', () => {
    const entries: ReturnEntry[] = [
      entry('EQP-II-000031', { cajon: cajon(9) }),
      entry('EQP-II-000032', { cajon: cajon(12), condition: 'dañado', notes: 'lente rayado' }),
      entry('INS-IC-000015', { cajon: cajon(1) }),
      entry('INS-IC-000017', { condition: 'extraviado' }),
    ];
    expect(missingCajon(entries)).toEqual([]);
    expect(buildCheckinPayload(164, entries, 'Todo en orden')).toEqual({
      loan_id: 164,
      general_notes: 'Todo en orden\nDañado Proyector Epson (EQP-II-000032): lente rayado',
      items: [
        { item_id: 501, condition: 'bueno', units: [{ id: 31, cajon_id: 9 }] },
        { item_id: 501, condition: 'dañado', damaged: true, units: [{ id: 32, cajon_id: 12 }] },
        { item_id: 503, condition: 'bueno', cajon_id: 1 },
        { item_id: 504, condition: 'extraviado' },
      ],
    });
  });

  it('detecta entradas que aún esperan su cajón', () => {
    const waiting = entry('EQP-II-000031');
    expect(missingCajon([waiting, entry('INS-IC-000017', { condition: 'extraviado' })])).toEqual([waiting]);
  });
});
