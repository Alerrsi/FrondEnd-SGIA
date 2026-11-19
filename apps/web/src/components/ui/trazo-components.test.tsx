import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Boxes } from 'lucide-react';

import { Button } from './button';
import { Cell } from './cell';
import { CellGrid } from './cell-grid';
import { EmptyState } from './empty-state';
import { Kbd } from './kbd';
import { Metric } from './metric';
import { MobileRow } from './mobile-row';
import { PageHeader } from './page-header';
import { TableFrame } from './table-frame';
import { TableSearch } from './table-search';

describe('Componentes base «Trazo»', () => {
  it('Button: el primario es el único relleno con el acento y todos son pastilla', () => {
    render(
      <>
        <Button>Guardar</Button>
        <Button variant="secondary">Cancelar</Button>
      </>,
    );
    const primary = screen.getByRole('button', { name: 'Guardar' });
    const secondary = screen.getByRole('button', { name: 'Cancelar' });
    expect(primary.className).toContain('bg-accent');
    expect(primary.className).toContain('rounded-full');
    expect(secondary.className).not.toContain('bg-accent');
    expect(primary.getAttribute('data-variant')).toBe('primary');
  });

  it('CellGrid y Cell: celda enlazada lleva a su ruta, celda sin enlace no es enlace', () => {
    render(
      <MemoryRouter>
        <CellGrid columns={2} aria-label="Pendientes">
          <Cell to="/prestamos/cola">Cola</Cell>
          <Cell>Sin enlace</Cell>
        </CellGrid>
      </MemoryRouter>,
    );
    const grid = screen.getByLabelText('Pendientes');
    expect(grid.className).toContain('cell-grid');
    expect(screen.getByRole('link', { name: 'Cola' }).getAttribute('href')).toBe('/prestamos/cola');
    expect(screen.queryByRole('link', { name: 'Sin enlace' })).toBeNull();
  });

  it('Metric muestra rótulo, cifra y contexto', () => {
    render(<Metric label="Stock crítico" value={6} hint="Bajo el mínimo" tone="danger" />);
    expect(screen.getByText('Stock crítico')).toBeDefined();
    expect(screen.getByText('6').className).toContain('text-danger');
    expect(screen.getByText('Bajo el mínimo')).toBeDefined();
  });

  it('EmptyState muestra la frase y la acción que lo resuelve', () => {
    render(<EmptyState icon={Boxes} title="Sin productos" action={<Button>Agregar producto</Button>} />);
    expect(screen.getByText('Sin productos')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Agregar producto' })).toBeDefined();
  });

  it('Kbd se oculta con puntero táctil', () => {
    render(<Kbd>N</Kbd>);
    expect(screen.getByText('N').className).toContain('pointer-fine:inline-flex');
  });

  it('PageHeader pone el título como h1 y las acciones aparte', () => {
    render(<PageHeader title="Inventario" description="Productos y stock" actions={<Button>Nuevo producto</Button>} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Inventario' })).toBeDefined();
    expect(screen.getByText('Productos y stock')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Nuevo producto' })).toBeDefined();
  });

  it('TableSearch: «/» enfoca la búsqueda salvo que se esté escribiendo en otro campo', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <input aria-label="Otro campo" />
        <TableSearch value="" onChange={onChange} placeholder="Buscar producto" />
      </>,
    );
    const search = screen.getByRole('searchbox', { name: 'Buscar producto' });
    await user.keyboard('/');
    expect(document.activeElement).toBe(search);

    const other = screen.getByRole('textbox', { name: 'Otro campo' });
    other.focus();
    await user.keyboard('/');
    expect(document.activeElement).toBe(other);
  });

  it('TableFrame con vista móvil oculta la tabla bajo 768px y muestra las filas', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const { container } = render(
      <TableFrame
        mobile={
          <ul>
            <MobileRow title="Notebook HP" meta="SKU-001" onClick={onOpen} />
          </ul>
        }
      >
        <table>
          <tbody>
            <tr>
              <td>Notebook HP</td>
            </tr>
          </tbody>
        </table>
      </TableFrame>,
    );
    expect(container.querySelector('[data-table-scroll]')?.className).toContain('max-md:hidden');
    await user.click(screen.getByRole('button', { name: /Notebook HP/ }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
