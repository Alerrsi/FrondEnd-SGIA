import { z } from 'zod';

export const PRODUCT_TYPES = ['insumo', 'equipo', 'maqueta'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

/** `equipo` y `maqueta` se gestionan por unidades: su cantidad la calcula el backend. */
export function isUnitTracked(type: ProductType): boolean {
  return type === 'equipo' || type === 'maqueta';
}

/** Convierte el valor de un `<select>`/`<input type=number>` a número (`''` → NaN). */
export const toNumber = (v: unknown) =>
  v === '' || v === null || v === undefined ? Number.NaN : Number(v);

/** Igual que `toNumber`, pero un campo vacío es `null` (opcional). */
export const toNullableNumber = (v: unknown) =>
  v === '' || v === null || v === undefined ? null : Number(v);

/**
 * Validación de UX del alta/edición de producto (§3 de ENDPOINTS.md). El backend sigue siendo
 * la fuente de verdad: si una regla no se puede ver aquí (p. ej. carrera sin `code`), responde 422.
 */
export const productoFormSchema = z
  .object({
    mode: z.enum(['create', 'edit']),
    type: z.enum(PRODUCT_TYPES),
    name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
    description: z.string().optional(),
    category_id: z
      .number({ error: 'Selecciona la categoría.' })
      .int()
      .positive('Selecciona la categoría.'),
    career_id: z.number().int().positive().nullable(),
    area: z.string().optional(),
    quantity: z
      .number({ error: 'Indica la cantidad.' })
      .int('Debe ser un número entero')
      .min(0, 'La cantidad debe ser mayor o igual a 0'),
    stock_minimo: z
      .number({ error: 'Indica el stock mínimo.' })
      .int('Debe ser un número entero')
      .min(0, 'El stock mínimo debe ser mayor o igual a 0'),
    auto_barcode: z.boolean(),
    barcode: z.string().optional(),
    location_id: z.number().nullable().optional(),
    cajon_id: z.number().nullable().optional(),
    sala: z.string().optional(),
    cajon: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    const isCreate = v.mode === 'create';
    const unitTracked = isUnitTracked(v.type);
    const withoutBarcode = v.auto_barcode || !v.barcode?.trim();

    // Alta: insumo sin código de barras → el backend genera INS-{carrera}-000001.
    if (isCreate && v.type === 'insumo' && withoutBarcode && !v.career_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['career_id'],
        message: 'Un insumo sin código de barras necesita la carrera para generar su código.',
      });
    }

    // Alta: equipo/maqueta con cantidad > 0 crea esas unidades (carrera + cajón obligatorios).
    if (isCreate && unitTracked && v.quantity > 0) {
      if (!v.career_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['career_id'],
          message: 'Las unidades de un equipo necesitan la carrera para generar su código.',
        });
      }
      const hasCajon = Boolean(v.cajon_id) || Boolean(v.sala?.trim() && v.cajon?.trim());
      if (!hasCajon) {
        ctx.addIssue({
          code: 'custom',
          path: ['cajon_id'],
          message: 'Selecciona el cajón donde quedan las unidades.',
        });
      }
    }
  });

export type ProductoFormValues = z.infer<typeof productoFormSchema>;
