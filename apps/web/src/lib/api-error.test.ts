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

  it('sin cuerpo usa un texto por estado', () => {
    expect(apiErrorToMessage(new ApiRequestError(404, null))).toBe('Recurso no encontrado.');
    expect(apiErrorToMessage(new ApiRequestError(418, null))).toBe('No se pudo completar la solicitud.');
  });

  // Auditoría de seguridad (F1): con APP_DEBUG el 500 trae el SQL; nunca se muestra.
  it('nunca muestra el cuerpo de un 5xx', () => {
    const error = new ApiRequestError(500, {
      message: 'SQLSTATE[22P02]: Invalid text representation (SQL: select * from "products" where "id" = abc)',
    });

    expect(apiErrorToMessage(error)).toBe(
      'Ocurrió un error en el servidor. Intenta nuevamente o contacta al administrador.',
    );
    expect(apiErrorToMessage(new ApiRequestError(503, null))).not.toMatch(/503|SQL/);
  });

  it('oculta los errores de red y de JavaScript', () => {
    expect(apiErrorToMessage(new TypeError('Failed to fetch'))).toBe(
      'No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.',
    );
    expect(apiErrorToMessage(new SyntaxError("Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"))).toBe(
      'Ocurrió un error inesperado. Intenta nuevamente.',
    );
    expect(apiErrorToMessage(new TypeError("Cannot read properties of undefined (reading 'id')"))).toBe(
      'Ocurrió un error inesperado. Intenta nuevamente.',
    );
    expect(apiErrorToMessage('texto')).toBe('Ocurrió un error inesperado. Intenta nuevamente.');
  });

  it('conserva los errores propios con texto para el usuario', () => {
    expect(apiErrorToMessage(new Error('La foto no tiene un archivo para enviar.'))).toBe(
      'La foto no tiene un archivo para enviar.',
    );
  });
});
