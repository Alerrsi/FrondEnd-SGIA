import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '@sgia/api-client';

import { apiErrorToMessage } from './api-error';

describe('apiErrorToMessage', () => {
  it('prioriza el primer error de validación del 422', () => {
    const error = new ApiRequestError(422, {
      message: 'Datos inválidos.',
      errors: { loan_date: ['La fecha de la actividad debe ser hoy o una fecha futura.'] },
    });

    expect(apiErrorToMessage(error)).toBe('La fecha de la actividad debe ser hoy o una fecha futura.');
  });

  it('sin errores por campo usa el mensaje del servidor', () => {
    expect(apiErrorToMessage(new ApiRequestError(403, { message: 'No autorizado.' }))).toBe('No autorizado.');
  });

  it('sin cuerpo indica el código de estado', () => {
    expect(apiErrorToMessage(new ApiRequestError(500, null))).toBe('Error 500');
  });
});
