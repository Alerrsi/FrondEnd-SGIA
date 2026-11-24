import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';

import { TypewriterName } from './components/typewriter-name';

function mockReducedMotion(reduced: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduced && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

const shown = () => screen.getByTestId('typewriter-name').textContent;
const phase = () => screen.getByTestId('typewriter-name').getAttribute('data-phase');

describe('TypewriterName (docs/saludo-animado.md)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('escribe el nombre letra por letra, lo deja quieto, lo borra y lo vuelve a escribir', () => {
    mockReducedMotion(false);
    render(
      <h1>
        Hola, <TypewriterName name="Ana" />
      </h1>,
    );
    expect(shown()).toBe('');

    act(() => vi.advanceTimersByTime(500));
    expect(shown()).toBe('A');
    act(() => vi.advanceTimersByTime(90));
    expect(shown()).toBe('An');
    act(() => vi.advanceTimersByTime(90));
    expect(shown()).toBe('Ana');
    expect(phase()).toBe('holding');
    // Completo, el cursor parpadea.
    expect(screen.getByTestId('typewriter-caret').className).toContain('ui-caret');

    act(() => vi.advanceTimersByTime(2800));
    expect(shown()).toBe('An');
    expect(screen.getByTestId('typewriter-caret').className).not.toContain('ui-caret');
    act(() => vi.advanceTimersByTime(45 * 2));
    expect(shown()).toBe('');
    act(() => vi.advanceTimersByTime(500 + 90 * 2));
    expect(shown()).toBe('Ana');
  });

  it('el lector de pantalla lee «Hola, Ana» una sola vez y el título reserva el ancho del nombre', () => {
    mockReducedMotion(false);
    render(
      <h1>
        Hola, <TypewriterName name="Ana" />
      </h1>,
    );
    expect(screen.getByRole('heading').textContent).toContain('Ana');
    expect(screen.getByRole('heading', { name: 'Hola, Ana' })).toBeDefined();
    const reserva = screen.getByTestId('typewriter-name').previousElementSibling!;
    expect(reserva.getAttribute('aria-hidden')).toBe('true');
    expect(reserva.className).toContain('invisible');
    expect(reserva.textContent).toBe('Ana');
  });

  it('con movimiento reducido el nombre queda completo, quieto y sin cursor', () => {
    mockReducedMotion(true);
    render(<TypewriterName name="Ana" />);
    expect(shown()).toBe('Ana');
    act(() => vi.advanceTimersByTime(10_000));
    expect(shown()).toBe('Ana');
    expect(screen.queryByTestId('typewriter-caret')).toBeNull();
  });

  it('con la pestaña oculta no avanza', () => {
    mockReducedMotion(false);
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    render(<TypewriterName name="Ana" />);
    act(() => vi.advanceTimersByTime(5000));
    expect(shown()).toBe('');
    hidden.mockReturnValue(false);
    act(() => vi.advanceTimersByTime(500));
    expect(shown()).toBe('A');
  });
});
