import { describe, expect, it } from 'vitest';
import { normalizeProducto } from '@sgia/api-client';

describe('normalizeProducto', () => {
  it('handles null or undefined input gracefully', () => {
    expect(normalizeProducto(null)).toBeNull();
    expect(normalizeProducto(undefined)).toBeUndefined();
  });

  it('normalizes backend raw product format with quantity and stock_minimo', () => {
    const raw = {
      id: 101,
      name: 'Tester Multímetro Digital Fluke 115',
      description: 'Multímetro digital para laboratorio de telecomunicaciones',
      barcode: 'SGIA-FLUKE-115',
      quantity: 5,
      stock_minimo: 10,
      area: 'Telecomunicaciones',
      is_active: true,
      created_at: '2026-10-01T10:00:00Z',
      updated_at: '2026-10-02T12:00:00Z',
      location: {
        id: 4,
        sala: 'Laboratorio 302',
        cajon: 'Estante B-2',
        description: 'Armario de instrumentos de precisión',
      },
      supplier: {
        id: 1,
        name: 'Electrónica y Redes Chile',
      },
    };

    const producto = normalizeProducto(raw);

    expect(producto.id).toBe(101);
    expect(producto.nombre).toBe('Tester Multímetro Digital Fluke 115');
    expect(producto.name).toBe('Tester Multímetro Digital Fluke 115');
    expect(producto.barcode).toBe('SGIA-FLUKE-115');
    expect(producto.codigoBarras).toBe('SGIA-FLUKE-115');
    expect(producto.stock).toBe(5);
    expect(producto.quantity).toBe(5);
    expect(producto.stockCritico).toBe(10);
    expect(producto.stock_minimo).toBe(10);
    expect(producto.activo).toBe(true);
    expect(producto.is_active).toBe(true);
    expect(producto.area).toBe('Telecomunicaciones');
    expect(producto.ubicacion?.sala).toBe('Laboratorio 302');
    expect(producto.ubicacion?.cajon).toBe('Estante B-2');
    expect(producto.ubicacion?.descripcion).toBe('Armario de instrumentos de precisión');
  });

  it('normalizes alternative frontend legacy fields (nombre, stock, stockCritico, ubicacion)', () => {
    const raw = {
      id: 202,
      nombre: 'Osciloscopio Digital 100MHz',
      descripcion: 'Canales duales con generador de funciones',
      codigoBarras: 'SGIA-OSC-002',
      categoria: 'Instrumentación',
      marca: 'Rigol',
      modelo: 'DS1054Z',
      stock: 2,
      stockCritico: 4,
      activo: false,
      ubicacion: {
        id: 9,
        sala: 'Pañol Central',
        cajon: 'Gaveta 01',
      },
    };

    const producto = normalizeProducto(raw);

    expect(producto.id).toBe(202);
    expect(producto.nombre).toBe('Osciloscopio Digital 100MHz');
    expect(producto.name).toBe('Osciloscopio Digital 100MHz');
    expect(producto.barcode).toBe('SGIA-OSC-002');
    expect(producto.codigoBarras).toBe('SGIA-OSC-002');
    expect(producto.stock).toBe(2);
    expect(producto.quantity).toBe(2);
    expect(producto.stockCritico).toBe(4);
    expect(producto.stock_minimo).toBe(4);
    expect(producto.categoria).toBe('Instrumentación');
    expect(producto.marca).toBe('Rigol');
    expect(producto.modelo).toBe('DS1054Z');
    expect(producto.activo).toBe(false);
    expect(producto.is_active).toBe(false);
    expect(producto.ubicacion?.sala).toBe('Pañol Central');
    expect(producto.ubicacion?.cajon).toBe('Gaveta 01');
  });

  it('provides safe fallback defaults for missing nested location and numbers', () => {
    const raw = {
      id: 303,
      name: 'Cable UTP Cat6 305m',
    };

    const producto = normalizeProducto(raw);

    expect(producto.id).toBe(303);
    expect(producto.nombre).toBe('Cable UTP Cat6 305m');
    expect(producto.stock).toBe(0);
    expect(producto.quantity).toBe(0);
    expect(producto.stockCritico).toBe(0);
    expect(producto.stock_minimo).toBe(0);
    expect(producto.activo).toBe(true);
    expect(producto.is_active).toBe(true);
    expect(producto.ubicacion?.id).toBe(0);
    expect(producto.ubicacion?.sala).toBe('');
    expect(producto.ubicacion?.cajon).toBe('');
    expect(producto.ubicacion?.descripcion).toBeNull();
  });
});
