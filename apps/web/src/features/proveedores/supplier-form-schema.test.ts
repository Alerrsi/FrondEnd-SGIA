import { describe, expect, it } from 'vitest';

import { supplierFormSchema, toSupplierPayload } from './lib/supplier-form-schema';

const base = {
  name: 'TechPro',
  contact_name: '',
  email: 'ventas@techpro.cl',
  phone: '',
  areas: ['informatica' as const],
};

describe('Esquema del proveedor (áreas)', () => {
  it('exige al menos un área', () => {
    const res = supplierFormSchema.safeParse({ ...base, areas: [] });
    expect(res.success).toBe(false);
    expect(res.error?.issues[0]?.path).toEqual(['areas']);
  });

  it('acepta varias áreas sin tope y rechaza valores fuera del enum', () => {
    expect(
      supplierFormSchema.safeParse({
        ...base,
        areas: ['informatica', 'diseno', 'telecomunicaciones', 'ciberseguridad'],
      }).success,
    ).toBe(true);
    expect(supplierFormSchema.safeParse({ ...base, areas: ['redes'] }).success).toBe(false);
  });

  it('valida el correo y envía las áreas en el payload', () => {
    expect(supplierFormSchema.safeParse({ ...base, email: 'malo' }).success).toBe(false);
    expect(toSupplierPayload(base)).toMatchObject({ areas: ['informatica'], contact_name: undefined });
  });
});
