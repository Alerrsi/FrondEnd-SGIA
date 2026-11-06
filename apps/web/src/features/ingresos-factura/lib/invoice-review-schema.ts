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
    .replace(/k/g, 'c') // alkalina / alcalina
    .replace(/([a-z])(\d)/g, '$1 $2') // corrugado1 -> corrugado 1
    .replace(/(\d)([a-z])/g, '$1 $2') // 2x5 -> 2 x 5
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const tokens = (s: string) => new Set(normalize(s).split(' ').filter(Boolean));

/**
 * Busca el producto existente que corresponde al nombre detectado por el OCR, sin importar mayúsculas,
 * tildes ni puntuación: primero igualdad exacta y, si no, el de mayor coincidencia de palabras (>= 75 % de
 * las del nombre más corto). Si hay empate no asocia nada.
 * shortcut: coincidencia por palabras sin tolerar erratas del OCR; subir a distancia de edición si hace falta.
 */
export function matchProduct(detectedName: string, products: Producto[]): Producto | undefined {
  const target = normalize(detectedName);
  if (!target) return undefined;
  const name = (p: Producto) => p.nombre ?? p.name ?? '';
  const exact = products.find((p) => normalize(name(p)) === target);
  if (exact) return exact;

  const a = tokens(detectedName);
  const scored = products
    .map((p) => {
      const b = tokens(name(p));
      const common = [...a].filter((t) => b.has(t)).length;
      return { p, score: common / Math.min(a.size, b.size || 1) };
    })
    .filter((x) => x.score >= 0.75)
    .sort((x, y) => y.score - x.score);
  const [best, second] = scored;
  return best && (!second || best.score > second.score) ? best.p : undefined;
}

/**
 * Productos parecidos al nombre del OCR (hasta `limit`), por similitud de palabras (Jaccard >= 0.25) con la
 * misma normalización de `matchProduct`. Sirve para ofrecer elegir uno antes de crear un producto nuevo.
 */
export function suggestProducts(detectedName: string, products: Producto[], limit = 3): Producto[] {
  const a = tokens(detectedName);
  if (a.size === 0) return [];
  return products
    .map((p) => {
      const b = tokens(p.nombre ?? p.name ?? '');
      const common = [...a].filter((t) => b.has(t)).length;
      return { p, score: common / (a.size + b.size - common) };
    })
    .filter((x) => x.score >= 0.25)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((x) => x.p);
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
