import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './theme-context';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { TooltipProvider } from '@/components/ui/tooltip';

function TestConsumer() {
  const { theme, resolvedTheme, setTheme, toggleTheme, isSystem } = useTheme();

  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <span data-testid="is-system">{String(isSystem)}</span>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
      <button onClick={toggleTheme}>Toggle</button>
      <ThemeToggle variant="segmented" />
    </div>
  );
}

describe('Theme System & Automatic Dark Mode (Dual Theme SGIA)', () => {
  let mediaQueryListeners: Array<(e: MediaQueryListEvent) => void> = [];
  let matchesMock = false;

  beforeEach(() => {
    localStorage.clear();
    mediaQueryListeners = [];
    matchesMock = false;

    // Reset document element
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: matchesMock,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          mediaQueryListeners.push(listener);
        }
      }),
      removeEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
        if (event === 'change') {
          mediaQueryListeners = mediaQueryListeners.filter((l) => l !== listener);
        }
      }),
      dispatchEvent: vi.fn(),
    }));
  });

  it('inicializa en modo "system" por defecto y resuelve según el sistema operativo (claro)', () => {
    matchesMock = false; // OS is light

    render(
      <TooltipProvider>
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      </TooltipProvider>,
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('system');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('light');
    expect(screen.getByTestId('is-system').textContent).toBe('true');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('detecta automáticamente cuando el sistema operativo está en modo oscuro', () => {
    matchesMock = true; // OS is dark

    render(
      <TooltipProvider>
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      </TooltipProvider>,
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('system');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('reacciona dinámicamente cuando el sistema operativo cambia de claro a oscuro en tiempo real', () => {
    matchesMock = false;

    render(
      <TooltipProvider>
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      </TooltipProvider>,
    );

    expect(screen.getByTestId('resolved-theme').textContent).toBe('light');

    // Simular evento del sistema operativo cambiando a dark
    act(() => {
      mediaQueryListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });
    });

    expect(screen.getByTestId('resolved-theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('permite cambiar manualmente a modo oscuro forzado y persistir en localStorage', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      </TooltipProvider>,
    );

    await user.click(screen.getByText('Set Dark'));

    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('dark');
    expect(screen.getByTestId('is-system').textContent).toBe('false');
    expect(localStorage.getItem('sgia-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('permite alternar con el selector segmentado ThemeToggle entre Automático, Claro y Oscuro', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <ThemeProvider>
          <TestConsumer />
        </ThemeProvider>
      </TooltipProvider>,
    );

    // Clic en opción Claro en el toggle segmentado
    const lightBtn = screen.getByRole('button', { name: 'Claro' });
    await user.click(lightBtn);

    expect(screen.getByTestId('current-theme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);

    // Clic en opción Oscuro
    const darkBtn = screen.getByRole('button', { name: 'Oscuro' });
    await user.click(darkBtn);

    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Clic en opción Automático
    const autoBtn = screen.getByRole('button', { name: 'Automático (SO)' });
    await user.click(autoBtn);

    expect(screen.getByTestId('current-theme').textContent).toBe('system');
    expect(screen.getByTestId('is-system').textContent).toBe('true');
  });
});
