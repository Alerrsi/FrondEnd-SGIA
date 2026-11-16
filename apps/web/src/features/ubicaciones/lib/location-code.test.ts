import { describe, expect, it } from 'vitest';
import {
  cajonFullCode,
  normalizeCajonCode,
  sanitizeLocationCode,
  suggestLocationCode,
} from './location-code';

describe('suggestLocationCode', () => {
  it.each([
    ['Pañol Central', 'PCENTRAL'],
    ['Pañol de Redes', 'PREDES'],
    ['Laboratorio de Ciberseguridad L-206', 'L206'],
    ['Bodega Edificio E', 'BEDIFICIOE'],
    ['Laboratorio E-301', 'E301'],
    ['Taller T-102', 'T102'],
    ['Sala E 301', 'E301'],
    ['Laboratorio de Programación E-205', 'E205'],
  ])('%s → %s', (nombre, code) => {
    expect(suggestLocationCode(nombre)).toBe(code);
  });

  it('con una palabra usa sus primeras 8 letras', () => {
    expect(suggestLocationCode('Electrónica')).toBe('ELECTRON');
  });

  it('con varias palabras corta a 10 caracteres', () => {
    expect(suggestLocationCode('Taller de Mecánica Automotriz')).toBe('TMECANICAA');
  });

  it('no confunde un número suelto con un número de sala', () => {
    expect(suggestLocationCode('Laboratorio 201')).toBe('L201');
    expect(suggestLocationCode('Mesa 1')).toBe('M1');
  });

  it('devuelve vacío sin nombre', () => {
    expect(suggestLocationCode('   ')).toBe('');
  });
});

describe('normalizeCajonCode', () => {
  it.each([
    ['Mesa 1 Cajón', 'MESA-1-CAJON'],
    ['Rack R1', 'RACK-R1'],
    ['Rack-R1', 'RACK-R1'],
    ['  gaveta  B--4 ', 'GAVETA-B-4'],
    ['#estante/2#', 'ESTANTE-2'],
  ])('%s → %s', (codigo, normalized) => {
    expect(normalizeCajonCode(codigo)).toBe(normalized);
  });
});

describe('cajonFullCode', () => {
  it('une sala y cajón con guion', () => {
    expect(cajonFullCode('L206', 'Rack R1')).toBe('L206-RACK-R1');
  });

  it('sin código de sala devuelve solo el cajón', () => {
    expect(cajonFullCode('', 'Rack R1')).toBe('RACK-R1');
  });
});

describe('sanitizeLocationCode', () => {
  it('deja solo A-Z0-9 en mayúsculas y hasta 10 caracteres', () => {
    expect(sanitizeLocationCode('l-206 ñ')).toBe('L206N');
    expect(sanitizeLocationCode('ABCDEFGHIJKL')).toBe('ABCDEFGHIJ');
  });
});
