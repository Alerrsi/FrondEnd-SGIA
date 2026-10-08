import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Layers, Boxes, Bell } from 'lucide-react';

import { GlassIconBar, type IconNavItem } from './iconbar';
import { TooltipProvider } from './tooltip';

const testItems: IconNavItem[] = [
  { key: '/inventario', label: 'Inventario', Icon: Layers, to: '/inventario' },
  { key: '/equipos', label: 'Equipos', Icon: Boxes, to: '/equipos' },
  { key: '/alertas', label: 'Alertas', Icon: Bell, to: '/alertas' },
];

describe('GlassIconBar Component (REQ-DISEÑO)', () => {
  it('renders navigation with vertical orientation (column) when axis="column"', () => {
    render(
      <MemoryRouter initialEntries={['/inventario']}>
        <TooltipProvider>
          <GlassIconBar axis="column" items={testItems} />
        </TooltipProvider>
      </MemoryRouter>,
    );

    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(nav).toBeDefined();
    expect(nav.getAttribute('data-orientation')).toBe('vertical');
  });

  it('renders all items as accessible links with aria-labels', () => {
    render(
      <MemoryRouter initialEntries={['/inventario']}>
        <TooltipProvider>
          <GlassIconBar axis="column" items={testItems} />
        </TooltipProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Inventario' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Equipos' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Alertas' })).toBeDefined();
  });

  it('marks current route as active page with data-active="true"', () => {
    render(
      <MemoryRouter initialEntries={['/equipos']}>
        <TooltipProvider>
          <GlassIconBar axis="column" items={testItems} />
        </TooltipProvider>
      </MemoryRouter>,
    );

    const equiposLink = screen.getByRole('link', { name: 'Equipos' });
    expect(equiposLink.getAttribute('data-active')).toBe('true');
    expect(equiposLink.getAttribute('aria-current')).toBe('page');

    const inventarioLink = screen.getByRole('link', { name: 'Inventario' });
    expect(inventarioLink.getAttribute('data-active')).toBe('false');
  });

  it('handles item clicks and invokes selection callbacks', async () => {
    const handleSelect = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/inventario']}>
        <TooltipProvider>
          <GlassIconBar
            axis="column"
            items={testItems}
            onSelect={handleSelect}
          />
        </TooltipProvider>
      </MemoryRouter>,
    );

    const alertasLink = screen.getByRole('link', { name: 'Alertas' });
    await user.click(alertasLink);

    expect(handleSelect).toHaveBeenCalledWith('/alertas');
  });
});
