import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { toast } from '@/lib/toast';
import MapaSalaPage from './pages/mapa-sala-page';
import { KEYBOARD_SAVE_DELAY_MS } from './hooks/use-estante-keyboard';
import { apiState, resetApiState } from './test-api-mock';

vi.mock('@sgia/api-client', async (importOriginal) => {
  const { buildApiMock } = await import('./test-api-mock');
  return { ...(await importOriginal<typeof import('@sgia/api-client')>()), ...buildApiMock() };
});

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Pañolero', role: 'PAN-01' } }),
}));

// jsdom/happy-dom no calculan la matriz de pantalla: con la identidad, 1 px de puntero = 1 cm del plano.
const IDENTITY = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

async function renderEditing() {
  render(
    <MemoryRouter initialEntries={['/mapa-salas/7']}>
      <Routes>
        <Route path="/mapa-salas/:locationId" element={<MapaSalaPage />} />
      </Routes>
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Editar distribución' }));
}

function estante(codigo: string): SVGGElement {
  return screen.getByRole('button', { name: new RegExp(`^Estante ${codigo},`) }) as unknown as SVGGElement;
}

function drag(element: Element, to: { x: number; y: number }, from = { x: 0, y: 0 }) {
  fireEvent.pointerDown(element, { pointerId: 1, button: 0, clientX: from.x, clientY: from.y });
  fireEvent.pointerMove(window, { pointerId: 1, clientX: (from.x + to.x) / 2, clientY: (from.y + to.y) / 2 });
  fireEvent.pointerMove(window, { pointerId: 1, clientX: to.x, clientY: to.y });
  fireEvent.pointerUp(window, { pointerId: 1, clientX: to.x, clientY: to.y });
}

describe('Arrastre y teclado en el mapa (REQ-22)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetApiState();
    Object.defineProperty(SVGSVGElement.prototype, 'getScreenCTM', {
      configurable: true,
      value: () => ({ ...IDENTITY, inverse: () => IDENTITY }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('al soltar ajusta a 10 cm, recalcula la zona y guarda con PATCH', async () => {
    await renderEditing();

    // EST-B1 está en (600, 80) dentro de «Zona B»; se mueve 103 × 47 cm.
    drag(estante('EST-B1'), { x: 103, y: 47 });

    expect(apiState.updateEstante).toHaveBeenCalledTimes(1);
    expect(apiState.updateEstante.mock.calls[0]?.[0]).toEqual({
      id: 3,
      locationId: 7,
      payload: { x: 700, y: 130, rotation: 0, zona_id: 2 },
    });
    expect(estante('EST-B1').getAttribute('transform')).toBe('translate(700 130)');
  });

  it('fuera de toda zona el estante queda sin zona', async () => {
    await renderEditing();

    drag(estante('EST-B1'), { x: 0, y: 400 });

    expect(apiState.updateEstante.mock.calls[0]?.[0].payload).toEqual({ x: 600, y: 480, rotation: 0, zona_id: null });
  });

  it('un clic sin movimiento no guarda y abre el pop-up', async () => {
    await renderEditing();

    drag(estante('EST-B1'), { x: 2, y: 1 });

    expect(apiState.updateEstante).not.toHaveBeenCalled();
    expect(await screen.findByRole('dialog')).toBeDefined();
  });

  it('soltar encima de otro estante vuelve a su lugar con el motivo', async () => {
    await renderEditing();

    // EST-A1 ocupa (100, 100, 60 × 300): llevar EST-B1 a (120, 140) lo pisa.
    drag(estante('EST-B1'), { x: -480, y: 60 });

    expect(apiState.updateEstante).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Se superpone con el estante EST-A1.');
    expect(estante('EST-B1').getAttribute('transform')).toBe('translate(600 80)');
  });

  it('soltar fuera de la sala tampoco se guarda', async () => {
    await renderEditing();

    drag(estante('EST-B1'), { x: 300, y: 0 });

    expect(apiState.updateEstante).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('El estante queda fuera de la sala.');
  });

  it('Escape cancela un arrastre en curso', async () => {
    await renderEditing();
    const element = estante('EST-B1');

    fireEvent.pointerDown(element, { pointerId: 1, button: 0, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 50, clientY: 50 });
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 50, clientY: 50 });

    expect(apiState.updateEstante).not.toHaveBeenCalled();
    expect(element.getAttribute('transform')).toBe('translate(600 80)');
  });

  it('las flechas mueven 10 cm (50 con Shift) y guardan una sola vez al final', async () => {
    await renderEditing();
    vi.useFakeTimers();
    const element = estante('EST-B1');

    act(() => {
      fireEvent.keyDown(element, { key: 'ArrowRight' });
      fireEvent.keyDown(element, { key: 'ArrowRight' });
      fireEvent.keyDown(element, { key: 'ArrowDown', shiftKey: true });
    });
    expect(estante('EST-B1').getAttribute('transform')).toBe('translate(620 130)');
    expect(apiState.updateEstante).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(KEYBOARD_SAVE_DELAY_MS);
    });

    expect(apiState.updateEstante).toHaveBeenCalledTimes(1);
    expect(apiState.updateEstante.mock.calls[0]?.[0].payload).toEqual({ x: 620, y: 130, rotation: 0, zona_id: 2 });
  });

  it('R gira el estante enfocado', async () => {
    await renderEditing();
    vi.useFakeTimers();

    act(() => {
      fireEvent.keyDown(estante('EST-B1'), { key: 'r' });
      vi.advanceTimersByTime(KEYBOARD_SAVE_DELAY_MS);
    });

    expect(apiState.updateEstante.mock.calls[0]?.[0].payload).toMatchObject({ x: 600, y: 80, rotation: 90 });
  });

  it('el MovePad mueve el estante seleccionado', async () => {
    await renderEditing();
    fireEvent.pointerDown(estante('EST-B1'), { pointerId: 1, button: 0, clientX: 0, clientY: 0 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 0, clientY: 0 });
    // El clic abre el pop-up; se cierra para usar el MovePad.
    await userEvent.keyboard('{Escape}');
    vi.useFakeTimers();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Mover a la izquierda' }));
      vi.advanceTimersByTime(KEYBOARD_SAVE_DELAY_MS);
    });

    expect(apiState.updateEstante.mock.calls[0]?.[0].payload).toMatchObject({ x: 590, y: 80 });
  });

  it('arrastrar una zona la mueve y redimensionar cambia su tamaño', async () => {
    await renderEditing();
    const zona = document.querySelector('[data-zona-id="2"]') as SVGGElement;

    drag(zona, { x: -48, y: 102 });
    expect(apiState.updateZona.mock.calls[0]?.[0]).toEqual({
      id: 2,
      locationId: 7,
      payload: { x: 500, y: 150, width: 400, depth: 200 },
    });

    const handle = zona.querySelector('[data-zona-handle]') as SVGGElement;
    drag(handle, { x: -96, y: 31 });
    expect(apiState.updateZona.mock.calls[1]?.[0].payload).toEqual({ x: 550, y: 50, width: 300, depth: 230 });
  });
});
