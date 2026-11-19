import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsModal } from './settings-modal';
import { ThemeProvider } from '@/contexts/theme-context';
import { TooltipProvider } from '@/components/ui/tooltip';

describe('SettingsModal Component (REQ-CONFIG)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-palette');
  });

  it('no se renderiza cuando open es false', () => {
    render(
      <TooltipProvider>
        <ThemeProvider>
          <SettingsModal open={false} onClose={vi.fn()} />
        </ThemeProvider>
      </TooltipProvider>,
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renderiza el título y los modos de visualización, sin paletas alternativas', () => {
    render(
      <TooltipProvider>
        <ThemeProvider>
          <SettingsModal open={true} onClose={vi.fn()} />
        </ThemeProvider>
      </TooltipProvider>,
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Ajustes del sistema')).toBeDefined();
    expect(screen.queryByText('Paleta de colores de interfaz')).toBeNull();

    expect(screen.getByRole('button', { name: 'Claro' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Oscuro' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sistema' })).toBeDefined();
  });

  it('cambia el modo de visualización y lo guarda', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <ThemeProvider>
          <SettingsModal open={true} onClose={vi.fn()} />
        </ThemeProvider>
      </TooltipProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Oscuro' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('sgia-theme')).toBe('dark');
  });

  it('ejecuta onClose al hacer clic en el botón Cerrar', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <ThemeProvider>
          <SettingsModal open={true} onClose={handleClose} />
        </ThemeProvider>
      </TooltipProvider>,
    );

    const closeBtn = screen.getByRole('button', { name: 'Cerrar' });
    await user.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
