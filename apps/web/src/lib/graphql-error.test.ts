import { describe, expect, it } from 'vitest';
import { graphQLErrorMessage } from '@sgia/api-client';

// Auditoría de seguridad (F1): los errores del motor GraphQL no llegan al usuario.
describe('graphQLErrorMessage', () => {
  const generic = 'No se pudieron cargar las métricas. Intenta nuevamente.';

  it('muestra los errores de resolver (UserError en español)', () => {
    expect(graphQLErrorMessage({ message: 'CUSTOM requiere dateFrom (y opcionalmente dateTo).', path: ['customMetric'] })).toBe(
      'CUSTOM requiere dateFrom (y opcionalmente dateTo).',
    );
  });

  it('oculta los errores de sintaxis, validación e internos', () => {
    expect(graphQLErrorMessage({ message: 'Cannot query field "secret" on type "Query".' })).toBe(generic);
    expect(graphQLErrorMessage({ message: 'Syntax Error: Expected Name, found <EOF>.' })).toBe(generic);
    expect(graphQLErrorMessage({ message: 'Internal server error', path: ['customMetric'] })).toBe(generic);
    expect(graphQLErrorMessage(undefined)).toBe(generic);
  });
});
