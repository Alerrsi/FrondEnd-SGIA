import { describe, expect, it } from 'vitest';
import { normalizePrestamo } from '@sgia/api-client';
import { loanDisplayState, summarizeTeacherLoans } from '@sgia/api-client/loan-state';

describe('loanDisplayState (regla compartida web y móvil)', () => {
  it('sigue la máquina del backend: en_proceso es preparado y procesado es entregado hasta returned_at', () => {
    expect(loanDisplayState({ status: 'pendiente' })).toBe('pendiente');
    expect(loanDisplayState({ status: 'en_proceso' })).toBe('preparado');
    expect(loanDisplayState({ status: 'procesado', returned_at: null })).toBe('en_prestamo');
    expect(loanDisplayState({ status: 'procesado', returned_at: null, diasAtraso: 1 })).toBe('atrasado');
    expect(loanDisplayState({ status: 'procesado', returned_at: '2026-11-10', diasAtraso: 4 })).toBe('devuelto');
    expect(loanDisplayState({ status: 'rechazado' })).toBe('rechazado');
    expect(loanDisplayState({ estado: 'algo-nuevo' })).toBe('otro');
  });

  it('acepta los nombres antiguos por compatibilidad', () => {
    expect(loanDisplayState({ estado: 'preparado' })).toBe('preparado');
    expect(loanDisplayState({ estado: 'activo' })).toBe('en_prestamo');
    expect(loanDisplayState({ estado: 'atrasado' })).toBe('atrasado');
    expect(loanDisplayState({ estado: 'devuelto' })).toBe('devuelto');
    expect(loanDisplayState({ estado: 'rechazada' })).toBe('rechazado');
  });

  it('summarizeTeacherLoans cuenta en revisión, para retirar y atrasadas', () => {
    expect(
      summarizeTeacherLoans([
        { status: 'pendiente' },
        { status: 'en_proceso' },
        { status: 'en_proceso' },
        { status: 'procesado', returned_at: null, diasAtraso: 2 },
        { status: 'procesado', returned_at: '2026-11-01', diasAtraso: 2 },
        { status: 'rechazado' },
      ]),
    ).toEqual({ inReview: 1, readyToPickUp: 2, overdue: 1 });
  });

  it('normalizePrestamo conserva returned_at: un préstamo devuelto no queda «En préstamo»', () => {
    const loan = normalizePrestamo({ id: 1, status: 'procesado', returned_at: '2026-11-10T12:00:00Z', items: [] });
    expect(loan.returned_at).toBe('2026-11-10T12:00:00Z');
    expect(loanDisplayState(loan)).toBe('devuelto');
  });
});
