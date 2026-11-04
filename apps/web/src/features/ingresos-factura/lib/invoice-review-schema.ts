import { z } from 'zod';
import type { ConfirmInvoiceIntakePayload, InvoiceIntake, Producto } from '@sgia/types';

type ProductType = NonNullable<Producto['type']>;

const itemSchema = z.object({
  product_id: z
    .number({ error: 'Asocia el ítem a un producto.' })
    .int()
    .positive('Asocia el ítem a un producto.'),
  detected_name: z.string().nullable(),
  quantity: z
    .number({ error: 'Indica la cantidad.' })
    .int('La cantidad debe ser entera.')
    .min(1, 'Mínimo 1.'),
  unit_price: z
    .number({ error: 'Indica el precio unitario.' })
    .min(0, 'El precio no puede ser negativo.'),
  cajon_id: z.number().int().positive().optional(),
});

/**
 * Validación de UX del borrador. `productTypes` permite exigir cajón a `equipo`/`maqueta`,
 * igual que el backend (que igual responde 422 si falta).
 */
export function buildInvoiceReviewSchema(productTypes: ReadonlyMap<number, ProductType>) {
  return z
    .object({
      document_number: z.string().trim().min(1, 'El número de factura es obligatorio.').max(100),
      items: z.array(itemSchema).min(1, 'Debes indicar al menos un ítem.'),
    })
    .superRefine((values, ctx) => {
      values.items.forEach((item, index) => {
        const type = productTypes.get(item.product_id);
        if ((type === 'equipo' || type === 'maqueta') && !item.cajon_id) {
          ctx.addIssue({
            code: 'custom',
            path: ['items', index, 'cajon_id'],
            message: 'Los equipos y maquetas necesitan un cajón para crear sus unidades.',
          });
        }
      });
    });
}

export type InvoiceReviewValues = z.infer<ReturnType<typeof buildInvoiceReviewSchema>>;
export type InvoiceReviewItem = InvoiceReviewValues['items'][number];

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Busca un producto existente con el mismo nombre que el detectado por el OCR (sin tildes ni mayúsculas). */
export function matchProduct(detectedName: string, products: Producto[]): Producto | undefined {
  const target = normalize(detectedName);
  if (!target) return undefined;
  return products.find((p) => normalize(p.nombre ?? p.name ?? '') === target);
}

/** Valores iniciales del formulario a partir del OCR del borrador. */
export function initialReviewValues(
  intake: InvoiceIntake,
  products: Producto[],
): InvoiceReviewValues {
  return {
    document_number: intake.document_number ?? intake.raw_ocr_payload.invoice_number ?? '',
    items: intake.raw_ocr_payload.items.map((it) => ({
      product_id: matchProduct(it.name, products)?.id ?? Number.NaN,
      detected_name: it.name,
      quantity: it.quantity,
      unit_price: it.unit_price,
      cajon_id: undefined,
    })),
  };
}

export function reviewTotal(
  items: Array<Pick<InvoiceReviewItem, 'quantity' | 'unit_price'>>,
): number {
  return items.reduce((sum, it) => {
    const q = Number.isFinite(it.quantity) ? it.quantity : 0;
    const p = Number.isFinite(it.unit_price) ? it.unit_price : 0;
    return sum + q * p;
  }, 0);
}

/** Payload de confirmación: el cajón solo viaja para equipos y maquetas. */
export function toConfirmPayload(
  values: InvoiceReviewValues,
  productTypes: ReadonlyMap<number, ProductType>,
): ConfirmInvoiceIntakePayload {
  return {
    document_number: values.document_number.trim(),
    items: values.items.map((it) => {
      const type = productTypes.get(it.product_id);
      const needsCajon = type === 'equipo' || type === 'maqueta';
      return {
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: it.unit_price,
        detected_name: it.detected_name || null,
        ...(needsCajon && it.cajon_id ? { cajon_id: it.cajon_id } : {}),
      };
    }),
  };
}
