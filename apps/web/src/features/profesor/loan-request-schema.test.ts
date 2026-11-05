import { describe, expect, it } from 'vitest';

import {
  initialLoanRequestValues,
  loanRequestSchema,
  toLoanRequestPayload,
  type LoanRequestValues,
} from './lib/loan-request-schema';

function valid(): LoanRequestValues {
  return {
    ...initialLoanRequestValues(1),
    career_id: 3,
    subject: 'Redes',
    loan_date: '2999-11-12',
    start_time: '08:30',
    end_time: '10:00',
    location_id: 12,
    notes: '',
    items: [{ product_id: 45, name: 'Cable UTP', available: 10, quantity: 3 }],
  };
}

const paths = (values: LoanRequestValues) => {
  const result = loanRequestSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
};

describe('loanRequestSchema', () => {
  it('acepta una solicitud completa', () => {
    expect(paths(valid())).toEqual([]);
  });

  it('exige carrera, asignatura, pañol, laboratorio, horas y fecha', () => {
    const values = {
      ...valid(),
      career_id: Number.NaN,
      subject: ' ',
      storeroom_id: Number.NaN,
      location_id: Number.NaN,
      start_time: '',
      end_time: '',
      loan_date: '',
    };
    expect(paths(values)).toEqual(
      expect.arrayContaining([
        'career_id',
        'subject',
        'storeroom_id',
        'location_id',
        'start_time',
        'end_time',
        'loan_date',
      ]),
    );
  });

  it('rechaza una fecha pasada', () => {
    expect(paths({ ...valid(), loan_date: '2000-01-01' })).toContain('loan_date');
  });

  it('la hora de término debe ser posterior a la de inicio, aunque falten otros campos', () => {
    expect(paths({ ...valid(), end_time: '08:30' })).toContain('end_time');
    expect(paths({ ...valid(), end_time: '08:00' })).toContain('end_time');
    expect(paths({ ...valid(), end_time: '08:00', subject: '' })).toEqual(
      expect.arrayContaining(['end_time', 'subject']),
    );
  });

  it('exige al menos un insumo y cantidades válidas', () => {
    expect(paths({ ...valid(), items: [] })).toContain('items');
    const zero = valid();
    zero.items[0]!.quantity = 0;
    expect(paths(zero)).toContain('items.0.quantity');
    const over = valid();
    over.items[0]!.quantity = 11;
    expect(paths(over)).toContain('items.0.quantity');
  });

  it('arma el payload sin profesor, room ni time_block', () => {
    const payload = toLoanRequestPayload({
      ...valid(),
      notes: ' Traer cables ',
    });
    expect(payload).toEqual({
      career_id: 3,
      subject: 'Redes',
      loan_date: '2999-11-12',
      start_time: '08:30',
      end_time: '10:00',
      storeroom_id: 1,
      location_id: 12,
      notes: 'Traer cables',
      items: [{ product_id: 45, quantity: 3 }],
    });
  });

  it('el vencimiento es opcional y no puede ser anterior a la fecha de la actividad', () => {
    expect(paths({ ...valid(), due_date: '' })).toEqual([]);
    expect(paths({ ...valid(), due_date: '2999-11-12' })).toEqual([]);
    expect(paths({ ...valid(), due_date: '2999-11-11' })).toEqual(['due_date']);
    expect(toLoanRequestPayload({ ...valid(), due_date: '2999-11-14' }).due_date).toBe(
      '2999-11-14',
    );
    expect(toLoanRequestPayload({ ...valid(), due_date: '' }).due_date).toBeUndefined();
  });
});
