import { describe, expect, it } from 'vitest';
import type { Prestamo } from '@sgia/types';

import {
  canCancelLoanRequest,
  formatDateOnly,
  loanLaboratory,
  loanSchedule,
} from './lib/loan-request-format';

describe('loan-request-format', () => {
  it('formatDateOnly no corre el día por la zona horaria', () => {
    expect(formatDateOnly('2026-11-12')).toBe('12-11-2026');
    expect(formatDateOnly('2026-01-01')).toBe('01-01-2026');
    expect(formatDateOnly(null)).toBe('—');
  });

  it('loanSchedule usa las horas y cae al time_block antiguo', () => {
    expect(loanSchedule({ start_time: '08:30', end_time: '10:00' } as Prestamo)).toBe('08:30 - 10:00');
    expect(loanSchedule({ time_block: 'Bloque 1-2' } as Prestamo)).toBe('Bloque 1-2');
    expect(loanSchedule({} as Prestamo)).toBe('—');
  });

  it('loanLaboratory prefiere la ubicación y cae a room', () => {
    expect(loanLaboratory({ location: { id: 1, nombre: 'Lab 3' }, room: 'x' } as Prestamo)).toBe('Lab 3');
    expect(loanLaboratory({ room: 'Lab 1' } as Prestamo)).toBe('Lab 1');
  });

  it('solo se cancela una solicitud pendiente', () => {
    expect(canCancelLoanRequest({ estado: 'pendiente' } as Prestamo)).toBe(true);
    expect(canCancelLoanRequest({ estado: 'procesado' } as Prestamo)).toBe(false);
  });
});
