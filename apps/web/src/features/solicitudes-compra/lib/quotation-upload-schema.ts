import { z } from 'zod';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** OC: `mimes:pdf,png,jpg,jpeg,webp` (StorePurchaseRequestOrderRequest). */
export const ORDER_FILE_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];
/** Cotización: además Word y Excel (StorePurchaseRequestQuotationRequest). */
export const QUOTATION_FILE_EXTENSIONS = [...ORDER_FILE_EXTENSIONS, 'doc', 'docx', 'xls', 'xlsx'];

export function acceptAttribute(extensions: string[]): string {
  return extensions.map((e) => `.${e}`).join(',');
}

function extensionOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

/** Se valida por extensión, como `mimes:` de Laravel (el MIME de Office varía según el navegador). */
function fileSchema(extensions: string[], formats: string) {
  return z
    .instanceof(File, { error: 'Adjunta el archivo.' })
    .refine((f) => f.size <= MAX_UPLOAD_BYTES, 'El archivo no puede superar 10 MB.')
    .refine((f) => extensions.includes(extensionOf(f.name)), `Formato no soportado: usa ${formats}.`);
}

const quotationFileSchema = fileSchema(QUOTATION_FILE_EXTENSIONS, 'PDF, imagen, Word o Excel');
const orderFileSchema = fileSchema(ORDER_FILE_EXTENSIONS, 'PDF, PNG, JPG o WEBP');

/** Cotización recibida por correo y subida a mano: proveedor contactado, archivo, total y precios. */
export const quotationUploadSchema = z.object({
  supplier_id: z
    .number({ error: 'Selecciona el proveedor.' })
    .int()
    .positive('Selecciona el proveedor.'),
  file: quotationFileSchema
    .nullable()
    .refine((f) => f !== null, 'Adjunta el archivo de la cotización.'),
  total: z.number({ error: 'Indica el total.' }).positive('El total debe ser mayor a 0.'),
  /** `AAAA-MM-DD` opcional; vacío = ahora (lo pone el backend). */
  received_at: z.string(),
  /** Uno por cada ítem de la solicitud: el backend exige `size` = cantidad de ítems. */
  items: z.array(
    z.object({
      purchase_request_item_id: z.number().int().positive(),
      unit_price: z
        .number({ error: 'Indica el precio unitario.' })
        .min(0, 'El precio no puede ser negativo.'),
    }),
  ),
});

/** Valores del formulario (archivo puede ser `null`) y los ya validados (archivo presente). */
export type QuotationUploadValues = z.input<typeof quotationUploadSchema>;
export type QuotationUploadParsed = z.output<typeof quotationUploadSchema>;

/** OC emitida fuera del sistema: archivo + número. */
export const orderUploadSchema = z.object({
  order_number: z
    .string()
    .trim()
    .min(1, 'Indica el número de la orden de compra.')
    .max(100, 'Máximo 100 caracteres.'),
  file: orderFileSchema.nullable().refine((f) => f !== null, 'Adjunta el archivo de la OC.'),
});

export type OrderUploadValues = z.input<typeof orderUploadSchema>;
export type OrderUploadParsed = z.output<typeof orderUploadSchema>;

/** Suma de `unit_price × cantidad` de los ítems: referencia para el total digitado. */
export function itemsSubtotal(
  items: Array<{ purchase_request_item_id: number; unit_price: number }>,
  quantities: Map<number, number>,
): number {
  return items.reduce(
    (sum, it) =>
      sum +
      (Number.isFinite(it.unit_price) ? it.unit_price : 0) *
        (quantities.get(it.purchase_request_item_id) ?? 0),
    0,
  );
}
