import { describe, expect, it } from 'vitest';
import type { Prestamo } from '@sgia/types';

import { loanCareer, loanSubject } from './lib/loan-display';

const loan = (extra: Partial<Prestamo>) => extra as Prestamo;

describe('loanSubject / loanCareer', () => {
  it('muestra asignatura y carrera cuando existen', () => {
    const l = loan({
      subject: 'Redes',
      career: { id: 3, name: 'Ingeniería en Informática', code: 'II' },
    });
    expect(loanSubject(l)).toBe('Redes');
    expect(loanCareer(l)).toBe('Ingeniería en Informática');
  });

  it('cae a los campos antiguos y a "—" en préstamos sin dato', () => {
    expect(loanSubject(loan({ asignatura: 'Electrónica' }))).toBe('Electrónica');
    expect(loanSubject(loan({ subject: null }))).toBe('—');
    expect(loanCareer(loan({ career: null }))).toBe('—');
  });
});
