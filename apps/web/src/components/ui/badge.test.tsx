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

    const badge = screen.getByText('En préstamo').closest('[data-tone]');
    expect(badge).toBeDefined();
    expect(badge?.getAttribute('data-tone')).toBe('loaned');
  });

  it('LoanStatusBadge lee los estados reales del backend con returned_at y diasAtraso', () => {
    const cases: Array<[Parameters<typeof LoanStatusBadge>[0], string, string]> = [
      [{ loan: { status: 'pendiente' } }, 'Pendiente', 'warning'],
      [{ loan: { status: 'en_proceso' } }, 'Preparado', 'accent'],
      [{ loan: { status: 'procesado', returned_at: null } }, 'En préstamo', 'loaned'],
      [{ loan: { status: 'procesado', returned_at: null, diasAtraso: 3 } }, 'Atrasado', 'critical'],
      [{ loan: { status: 'procesado', returned_at: '2026-11-10T12:00:00Z', diasAtraso: 3 } }, 'Devuelto', 'available'],
      [{ loan: { status: 'rechazado' } }, 'Rechazado', 'danger'],
      [{ estado: 'procesado' }, 'En préstamo', 'loaned'],
    ];
    for (const [props, label, tone] of cases) {
      const { unmount } = render(<LoanStatusBadge {...props} />);
      expect(screen.getByText(label).closest('[data-tone]')?.getAttribute('data-tone')).toBe(tone);
      unmount();
    }
  });
});
