import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, LoanStatusBadge } from './badge';

describe('Badge Component with Palette & Status Support', () => {
  it('asigna atributos data-tone y data-status para permitir estilización dinámica según paleta', () => {
    render(<Badge tone="available">activo</Badge>);

    const badge = screen.getByText('activo').closest('[data-tone]');
    expect(badge).toBeDefined();
    expect(badge?.getAttribute('data-tone')).toBe('available');
    expect(badge?.getAttribute('data-status')).toBe('activo');
  });

  it('renderiza estados inactivos con data-tone="retired"', () => {
    render(<Badge tone="retired">inactivo</Badge>);

    const badge = screen.getByText('inactivo').closest('[data-tone]');
    expect(badge).toBeDefined();
    expect(badge?.getAttribute('data-tone')).toBe('retired');
    expect(badge?.getAttribute('data-status')).toBe('inactivo');
  });

  it('LoanStatusBadge incluye dot indicador y tone apropiado', () => {
    render(<LoanStatusBadge estado="activo" />);

    const badge = screen.getByText('En Préstamo').closest('[data-tone]');
    expect(badge).toBeDefined();
    expect(badge?.getAttribute('data-tone')).toBe('loaned');
  });
});
