import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { isToasterEvent } from '@/lib/is-toaster-event';
import { toast } from '@/lib/toast';
import { Dialog } from './dialog';
import { Toaster } from './toaster';

const sound = vi.hoisted(() => ({ play: vi.fn() }));
vi.mock('@/lib/notification-sound', () => ({ playNotificationSound: sound.play }));

describe('Avisos emergentes propios (docs/avisos-emergentes.md)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Separa los avisos de cada test para que el sonido no quede «agrupado» con el anterior.
    vi.setSystemTime(Date.now() + 60_000);
  });

  afterEach(() => {
    act(() => toast.clear());
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('muestra el aviso con su texto, suena una vez aunque salgan varios juntos y los errores van en la región alerta', () => {
    render(<Toaster />);
    act(() => {
      toast.success({ title: 'Cajón L206-R1 marcado como lleno', description: 'Se ve en azul en el mapa.' });
      toast.error('No se pudo guardar');
    });

    const ok = screen.getByRole('button', { name: 'Quitar aviso: Cajón L206-R1 marcado como lleno. Se ve en azul en el mapa.' });
    expect(within(screen.getByRole('status')).getByText('Cajón L206-R1 marcado como lleno')).toBeDefined();
    expect(within(screen.getByRole('alert')).getByText('No se pudo guardar')).toBeDefined();
    expect(sound.play).toHaveBeenCalledOnce();

    // Hover y foco: rojo gradual (300 ms) con basurero; sin movimiento si se pide.
    expect(ok.className).toContain('hover:bg-danger-bg');
    expect(ok.className).toContain('duration-300');
    expect(ok.className).toContain('motion-reduce:transition-none');
    expect(within(ok).getByTestId('toast-trash').getAttribute('class')).toContain('group-hover:opacity-100');

    act(() => {
      vi.advanceTimersByTime(1_000);
      toast.info('Otro aviso más tarde');
    });
    expect(sound.play).toHaveBeenCalledTimes(2);
  });

  it('clic o Enter quitan el aviso', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Toaster />);
    act(() => {
      toast.success('Primero');
      toast.warning('Segundo');
    });

    await user.click(screen.getByRole('button', { name: 'Quitar aviso: Primero' }));
    expect(screen.queryByText('Primero')).toBeNull();

    screen.getByRole('button', { name: 'Quitar aviso: Segundo' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.queryByText('Segundo')).toBeNull();
  });

  it('se va solo a los 4 s, pero no mientras el mouse está encima; nunca hay más de 4', () => {
    render(<Toaster />);
    act(() => {
      toast.success('Se va solo');
    });
    const card = screen.getByRole('button', { name: 'Quitar aviso: Se va solo' });

    act(() => vi.advanceTimersByTime(3_000));
    fireEvent.pointerEnter(card);
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByText('Se va solo')).toBeDefined();
    fireEvent.pointerLeave(card);
    act(() => vi.advanceTimersByTime(999));
    expect(screen.getByText('Se va solo')).toBeDefined();
    act(() => vi.advanceTimersByTime(2));
    expect(screen.queryByText('Se va solo')).toBeNull();

    act(() => {
      for (let i = 1; i <= 6; i++) toast.info(`Aviso ${i}`);
    });
    expect(screen.getAllByRole('button', { name: /^Quitar aviso:/ })).toHaveLength(4);
    expect(screen.queryByText('Aviso 2')).toBeNull();
    expect(screen.getByText('Aviso 6')).toBeDefined();
  });

  it('reconoce el aviso aunque ya no esté en el DOM (Radix difiere el clic fuera hasta después de quitarlo)', () => {
    render(<Toaster />);
    act(() => {
      toast.success('Desprendido');
    });
    const card = screen.getByRole('button', { name: 'Quitar aviso: Desprendido' });
    const inner = card.querySelector('span')!;
    act(() => toast.clear());
    expect(card.isConnected).toBe(false);
    expect(isToasterEvent({ target: inner })).toBe(true);
    expect(isToasterEvent({ target: document.body })).toBe(false);
  });

  it('quitar un aviso con un modal abierto no cierra el modal', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime, pointerEventsCheck: 0 });
    const onClose = vi.fn();
    render(
      <>
        <Toaster />
        <Dialog open onClose={onClose} title="Editar estante">
          <p>Contenido</p>
        </Dialog>
      </>,
    );
    act(() => {
      toast.success('Estante guardado');
    });

    await user.click(screen.getByRole('button', { name: 'Quitar aviso: Estante guardado' }));
    expect(screen.queryByText('Estante guardado')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Editar estante' })).toBeDefined();
  });
});
