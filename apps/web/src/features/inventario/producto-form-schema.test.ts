import { describe, expect, it } from 'vitest';

import { productoFormSchema, type ProductoFormValues } from './lib/producto-form-schema';

const base: ProductoFormValues = {
  mode: 'create',
  type: 'insumo',
  name: 'Cable UTP Cat6',
  description: '',
  category_id: 1,
  career_id: 2,
  master_code: '',
  oracle_category_id: null,
  area: 'Informática',
  quantity: 10,
  stock_minimo: 5,
  auto_barcode: true,
  barcode: '',
  location_id: null,
  cajon_id: null,
  sala: '',
  cajon: '',
};

function issuePaths(values: ProductoFormValues): string[] {
  const result = productoFormSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
}

describe('productoFormSchema', () => {
  it('acepta un insumo completo', () => {
    expect(issuePaths(base)).toEqual([]);
  });

  it('exige la categoría', () => {
    expect(issuePaths({ ...base, category_id: Number.NaN })).toContain('category_id');
  });

  it('insumo sin código de barras exige carrera', () => {
    expect(issuePaths({ ...base, career_id: null })).toContain('career_id');
  });

  it('insumo con código manual no exige carrera', () => {
    expect(
      issuePaths({ ...base, career_id: null, auto_barcode: false, barcode: '7801234567890' }),
    ).toEqual([]);
  });

  it('equipo con cantidad > 0 exige carrera y cajón', () => {
    const paths = issuePaths({ ...base, type: 'equipo', career_id: null });
    expect(paths).toContain('career_id');
    expect(paths).toContain('cajon_id');
  });

  it('equipo con cajón por sala + cajón manual es válido', () => {
    expect(issuePaths({ ...base, type: 'maqueta', sala: 'Lab 3', cajon: 'C-05' })).toEqual([]);
  });

  it('equipo con cantidad 0 no exige cajón pero sí carrera', () => {
    expect(issuePaths({ ...base, type: 'equipo', quantity: 0, career_id: null })).toEqual([
      'career_id',
    ]);
    expect(issuePaths({ ...base, type: 'equipo', quantity: 0 })).toEqual([]);
  });

  it('en edición el equipo exige carrera pero no cajón', () => {
    expect(issuePaths({ ...base, mode: 'edit', type: 'equipo', career_id: null })).toEqual([
      'career_id',
    ]);
    expect(issuePaths({ ...base, mode: 'edit', type: 'equipo' })).toEqual([]);
  });

  it('en edición un insumo no exige carrera', () => {
    expect(issuePaths({ ...base, mode: 'edit', career_id: null })).toEqual([]);
  });

  it('el código maestro y la categoría de Oracle son opcionales', () => {
    expect(issuePaths({ ...base, master_code: '', oracle_category_id: null })).toEqual([]);
    expect(issuePaths({ ...base, master_code: 'OF33075', oracle_category_id: 3 })).toEqual([]);
  });

  it('valida el formato del código maestro', () => {
    expect(issuePaths({ ...base, master_code: 'OF 33075' })).toContain('master_code');
    expect(issuePaths({ ...base, master_code: 'A'.repeat(31) })).toContain('master_code');
  });
});
