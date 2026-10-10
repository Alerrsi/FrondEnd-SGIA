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

  it('renderiza título, sección de paletas y opciones de paleta Principal y B1', () => {
    render(
      <TooltipProvider>
        <ThemeProvider>
          <SettingsModal open={true} onClose={vi.fn()} />
        </ThemeProvider>
      </TooltipProvider>,
    );

    // Diálogo presente
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Ajustes del Sistema')).toBeDefined();
    expect(screen.getByText('Paleta de Colores de Interfaz')).toBeDefined();

    // Paleta Principal (Industrial INACAP)
    expect(screen.getByText('Paleta Principal (Industrial INACAP)')).toBeDefined();
    expect(screen.getByText('Predeterminada')).toBeDefined();

    // Paleta B1 (Azul Acero & Indigo) de AGENTS.md / Design.md
    expect(screen.getByText('Paleta B1 (Azul Acero & Indigo)')).toBeDefined();
    expect(screen.getByText('Alternativa B1')).toBeDefined();

    // Controles de Modo de Visualización (Claro, Oscuro, Sistema)
    expect(screen.getByRole('button', { name: 'Claro' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Oscuro' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sistema' })).toBeDefined();
  });

  it('permite cambiar a la paleta B1 al hacer clic y actualiza el atributo data-palette en el DOM', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <ThemeProvider>
          <SettingsModal open={true} onClose={vi.fn()} />
        </ThemeProvider>
      </TooltipProvider>,
    );

    const b1Option = screen.getByRole('button', {
      name: /Seleccionar Paleta B1 \(Azul Acero & Indigo\)/i,
    });
    await user.click(b1Option);

    expect(document.documentElement.getAttribute('data-palette')).toBe('b1');
    expect(localStorage.getItem('sgia-palette')).toBe('b1');

    // Cambiar de vuelta a la paleta Principal
    const defaultOption = screen.getByRole('button', {
      name: /Seleccionar Paleta Principal \(Industrial INACAP\)/i,
    });
    await user.click(defaultOption);

    expect(document.documentElement.getAttribute('data-palette')).toBe('default');
    expect(localStorage.getItem('sgia-palette')).toBe('default');
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
