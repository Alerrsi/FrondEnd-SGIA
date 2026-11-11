import { SUPPLIER_AREAS, type CreateSupplierPayload, type Supplier } from '@sgia/types';
import { z } from 'zod';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validación de UX del proveedor; el backend exige `areas` con `min:1`. `category` queda en retiro
 * (TASKS/front-end.md del backend): no se edita ni se envía, el backend conserva el valor.
 */
export const supplierFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  contact_name: z.string().trim(),
  email: z
    .string()
    .trim()
    .min(1, 'El correo electrónico es obligatorio')
    .regex(EMAIL_RE, 'Formato de correo inválido'),
  phone: z.string().trim(),
  areas: z.array(z.enum(SUPPLIER_AREAS)).min(1, 'Selecciona al menos un área del proveedor'),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export function supplierFormDefaults(supplier: Supplier | null): SupplierFormValues {
  return {
    name: supplier?.name ?? '',
    contact_name: supplier?.contact_name ?? '',
    email: supplier?.email ?? '',
    phone: supplier?.phone ?? '',
    areas: supplier?.areas ?? [],
  };
}

export function toSupplierPayload(values: SupplierFormValues): CreateSupplierPayload {
  return {
    name: values.name.trim(),
    contact_name: values.contact_name.trim() || undefined,
    email: values.email.trim(),
    phone: values.phone.trim() || undefined,
    areas: values.areas,
  };
}
