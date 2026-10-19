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

  it('renderiza título, sección de paletas y opciones de paleta Principal, B1 y pasteles', () => {
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

    // Paletas Pastel añadidas
    expect(screen.getByText('Sage Mint (Menta Salvia Suave)')).toBeDefined();
    expect(screen.getByText('Lavender Mist (Lavanda Empolvado)')).toBeDefined();
    expect(screen.getByText('Nordic Ice (Celeste Glaciar)')).toBeDefined();
    expect(screen.getByText('Peach & Sand (Melocotón Pastel)')).toBeDefined();
    expect(screen.getByText('Chamomile Honey (Manzanilla Suave)')).toBeDefined();

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

  it('permite seleccionar paletas pastel (Sage Mint, Lavender, Nordic, Peach, Chamomile) y persiste', async () => {
    const user = userEvent.setup();

    render(
      <TooltipProvider>
        <ThemeProvider>
          <SettingsModal open={true} onClose={vi.fn()} />
        </ThemeProvider>
      </TooltipProvider>,
    );

    // Seleccionar Sage Mint
    const sageOption = screen.getByRole('button', {
      name: /Seleccionar Sage Mint \(Menta Salvia Suave\)/i,
    });
    await user.click(sageOption);
    expect(document.documentElement.getAttribute('data-palette')).toBe('sage');
    expect(document.documentElement.classList.contains('palette-sage')).toBe(true);
    expect(localStorage.getItem('sgia-palette')).toBe('sage');

    // Seleccionar Lavender Mist
    const lavenderOption = screen.getByRole('button', {
      name: /Seleccionar Lavender Mist \(Lavanda Empolvado\)/i,
    });
    await user.click(lavenderOption);
    expect(document.documentElement.getAttribute('data-palette')).toBe('lavender');
    expect(document.documentElement.classList.contains('palette-lavender')).toBe(true);
    expect(document.documentElement.classList.contains('palette-sage')).toBe(false);
    expect(localStorage.getItem('sgia-palette')).toBe('lavender');

    // Seleccionar Nordic Ice
    const nordicOption = screen.getByRole('button', {
      name: /Seleccionar Nordic Ice \(Celeste Glaciar\)/i,
    });
    await user.click(nordicOption);
    expect(document.documentElement.getAttribute('data-palette')).toBe('nordic');
    expect(document.documentElement.classList.contains('palette-nordic')).toBe(true);
    expect(localStorage.getItem('sgia-palette')).toBe('nordic');
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
