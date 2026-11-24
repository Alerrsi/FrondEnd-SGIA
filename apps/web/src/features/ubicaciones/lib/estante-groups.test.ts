import { describe, expect, it } from 'vitest';
import type { CajonEntity, Estante } from '@sgia/types';

import { buildEstanteGroups, filterEstanteGroups, SIN_ESTANTE } from './estante-groups';

const ESTANTES = [
  {
    id: 1,
    codigo: 'EST-A1',
    nombre: 'Rack de cables',
    cajones: [
      { id: 11, codigo: 'A1-1', barcode: 'B-A1-1', products_count: 2, units_count: 3, lleno: true },
      { id: 12, codigo: 'A1-2', barcode: null, products_count: 0, units_count: 0, lleno: false },
    ],
  },
  { id: 2, codigo: 'EST-B1', nombre: null, cajones: [] },
] as unknown as Estante[];

const CAJONES = [
  { id: 11, codigo: 'A1-1', location_id: 1, estante_id: 1, descripcion: 'Conectores' },
  { id: 30, codigo: 'X1', location_id: 1, estante_id: null, barcode: 'B-X1', products_count: 4 },
] as CajonEntity[];

const code = (cajon: Pick<CajonEntity, 'barcode' | 'codigo'>) => cajon.barcode || `B-${cajon.codigo}`;

describe('buildEstanteGroups (docs/ubicaciones-distribucion.md)', () => {
  it('arma un grupo por estante con los cajones del plano y sus elementos, y «Sin estante» al final', () => {
    const groups = buildEstanteGroups(ESTANTES, CAJONES, code);

    expect(groups.map((g) => g.key)).toEqual([1, 2, SIN_ESTANTE]);
    expect(groups[0]!.cajones).toEqual([
      { id: 11, codigo: 'A1-1', code: 'B-A1-1', descripcion: 'Conectores', lleno: true, elementos: 5, estanteId: 1, estanteCodigo: 'EST-A1' },
      { id: 12, codigo: 'A1-2', code: 'B-A1-2', descripcion: null, lleno: false, elementos: 0, estanteId: 1, estanteCodigo: 'EST-A1' },
    ]);
    expect(groups[2]!.cajones).toEqual([
      { id: 30, codigo: 'X1', code: 'B-X1', descripcion: null, lleno: false, elementos: 4, estanteId: null, estanteCodigo: null },
    ]);
  });

  it('sin cajones sueltos no agrega el grupo «Sin estante»', () => {
    expect(buildEstanteGroups(ESTANTES, CAJONES.slice(0, 1), code).map((g) => g.key)).toEqual([1, 2]);
  });
});

describe('filterEstanteGroups', () => {
  const groups = buildEstanteGroups(ESTANTES, CAJONES, code);

  it('si coincide el estante lo deja entero', () => {
    const result = filterEstanteGroups(groups, 'cables');
    expect(result.map((g) => g.key)).toEqual([1]);
    expect(result[0]!.cajones).toHaveLength(2);
  });

  it('si coincide un cajón deja solo ese cajón de su estante', () => {
    const result = filterEstanteGroups(groups, 'conect');
    expect(result.map((g) => g.key)).toEqual([1]);
    expect(result[0]!.cajones.map((c) => c.id)).toEqual([11]);
    expect(filterEstanteGroups(groups, 'b-x1').map((g) => g.key)).toEqual([SIN_ESTANTE]);
  });

  it('sin texto devuelve todo', () => {
    expect(filterEstanteGroups(groups, '  ')).toBe(groups);
  });
});
