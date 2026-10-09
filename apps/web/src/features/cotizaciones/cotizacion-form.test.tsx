import { describe, expect, it } from 'vitest';

/**
 * Unit test: validación del formulario de cotizaciones.
 * Restricción institucional INACAP: >= 3 proveedores seleccionados.
 */

// Mock Zod-like validation logic extracted from the form
const MIN_SUPPLIERS = 3;

interface CotizacionFormData {
  products: Array<{ id: number; quantity: number }>;
  supplier_ids: number[];
  notes?: string;
}

function validateCotizacionForm(data: CotizacionFormData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.products || data.products.length === 0) {
    errors.push('Debe incluir al menos un producto en la cotización.');
  }

  if (!data.supplier_ids || data.supplier_ids.length < MIN_SUPPLIERS) {
    errors.push(
      `Debe seleccionar al menos ${MIN_SUPPLIERS} proveedores (regla institucional INACAP). Seleccionados: ${data.supplier_ids?.length ?? 0}.`,
    );
  }

  for (const product of data.products ?? []) {
    if (!product.id || product.id <= 0) {
      errors.push('Cada producto debe tener un ID válido.');
    }
    if (!product.quantity || product.quantity < 1) {
      errors.push('La cantidad de cada producto debe ser al menos 1.');
    }
  }

  // Check for duplicate products
  const ids = (data.products ?? []).map((p) => p.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    errors.push('No se permiten productos duplicados en una misma cotización.');
  }

  // Check for duplicate suppliers
  const supplierIds = data.supplier_ids ?? [];
  const uniqueSuppliers = new Set(supplierIds);
  if (supplierIds.length !== uniqueSuppliers.size) {
    errors.push('No se permiten proveedores duplicados.');
  }

  return { valid: errors.length === 0, errors };
}

describe('Validación del formulario de cotizaciones (REQ-07)', () => {
  describe('Restricción de mínimo de proveedores (>= 3)', () => {
    it('rechaza la cotización con 0 proveedores seleccionados', () => {
      const result = validateCotizacionForm({
        products: [{ id: 1, quantity: 5 }],
        supplier_ids: [],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('al menos 3 proveedores'),
      );
    });

    it('rechaza la cotización con 1 proveedor seleccionado', () => {
      const result = validateCotizacionForm({
        products: [{ id: 1, quantity: 5 }],
        supplier_ids: [10],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('al menos 3 proveedores'),
      );
    });

    it('rechaza la cotización con 2 proveedores seleccionados', () => {
      const result = validateCotizacionForm({
        products: [{ id: 1, quantity: 5 }],
        supplier_ids: [10, 20],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('al menos 3 proveedores'),
      );
    });

    it('acepta la cotización con exactamente 3 proveedores seleccionados', () => {
      const result = validateCotizacionForm({
        products: [{ id: 1, quantity: 5 }],
        supplier_ids: [10, 20, 30],
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('acepta la cotización con más de 3 proveedores seleccionados', () => {
      const result = validateCotizacionForm({
        products: [{ id: 1, quantity: 3 }],
        supplier_ids: [10, 20, 30, 40, 50],
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Validación de productos', () => {
    it('rechaza la cotización sin productos', () => {
      const result = validateCotizacionForm({
        products: [],
        supplier_ids: [10, 20, 30],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('al menos un producto'),
      );
    });

    it('rechaza productos con cantidad menor a 1', () => {
      const result = validateCotizacionForm({
        products: [{ id: 1, quantity: 0 }],
        supplier_ids: [10, 20, 30],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('cantidad de cada producto debe ser al menos 1'),
      );
    });

    it('rechaza productos con ID inválido', () => {
      const result = validateCotizacionForm({
        products: [{ id: 0, quantity: 5 }],
        supplier_ids: [10, 20, 30],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('ID válido'),
      );
    });

    it('rechaza productos duplicados', () => {
      const result = validateCotizacionForm({
        products: [
          { id: 1, quantity: 5 },
          { id: 1, quantity: 10 },
        ],
        supplier_ids: [10, 20, 30],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('productos duplicados'),
      );
    });

    it('acepta múltiples productos distintos con cantidades válidas', () => {
      const result = validateCotizacionForm({
        products: [
          { id: 1, quantity: 5 },
          { id: 2, quantity: 10 },
          { id: 3, quantity: 2 },
        ],
        supplier_ids: [10, 20, 30],
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Validación de proveedores duplicados', () => {
    it('rechaza proveedores duplicados', () => {
      const result = validateCotizacionForm({
        products: [{ id: 1, quantity: 5 }],
        supplier_ids: [10, 10, 20],
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining('proveedores duplicados'),
      );
    });
  });

  describe('Formulario completo válido', () => {
    it('acepta un formulario completo con notas opcionales', () => {
      const result = validateCotizacionForm({
        products: [
          { id: 1, quantity: 5 },
          { id: 2, quantity: 3 },
        ],
        supplier_ids: [10, 20, 30],
        notes: 'Entrega urgente requerida antes del 15 de noviembre.',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('acepta un formulario completo sin notas', () => {
      const result = validateCotizacionForm({
        products: [{ id: 7, quantity: 1 }],
        supplier_ids: [100, 200, 300],
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Múltiples errores simultáneos', () => {
    it('reporta múltiples errores cuando hay varios problemas', () => {
      const result = validateCotizacionForm({
        products: [],
        supplier_ids: [10],
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
      expect(result.errors).toContainEqual(
        expect.stringContaining('al menos un producto'),
      );
      expect(result.errors).toContainEqual(
        expect.stringContaining('al menos 3 proveedores'),
      );
    });
  });
});
