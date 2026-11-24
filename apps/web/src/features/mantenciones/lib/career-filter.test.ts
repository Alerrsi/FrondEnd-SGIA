import { describe, expect, it } from 'vitest';

import { careerFilterOf, careerFilterParams, careerLabel } from './career-filter';

describe('career-filter (docs/mantenciones-por-carrera.md)', () => {
  it('convierte la carrera elegida en parámetros del listado', () => {
    expect(careerFilterParams(null)).toEqual({});
    expect(careerFilterParams(3)).toEqual({ career_id: 3 });
    expect(careerFilterParams('none')).toEqual({ sin_carrera: true });
  });

  it('la carrera sin id es «sin carrera» y la etiqueta lleva el código', () => {
    expect(careerFilterOf({ career_id: null })).toBe('none');
    expect(careerFilterOf({ career_id: 7 })).toBe(7);
    expect(careerLabel({ code: 'AP', name: 'Analista Programador' })).toBe('AP · Analista Programador');
    expect(careerLabel({ code: null, name: 'Sin carrera' })).toBe('Sin carrera');
  });
});
