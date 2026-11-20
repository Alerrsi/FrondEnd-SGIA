import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { EstanteShape } from './components/estante-shape';
import { initialViewBox, SalaSvg } from './components/sala-svg';
import { ZonaShape } from './components/zona-shape';
import { makeEstante, makeMapa } from './test-fixtures';

function renderMapa(pxPerCm = 1) {
  const mapa = makeMapa();
  return render(
    <SalaSvg
      label="Laboratorio 206"
      width={1000}
      height={600}
      viewBox={initialViewBox(1000, 600)}
      pxPerCm={pxPerCm}
      background={mapa.zonas.map((zona) => <ZonaShape key={zona.id} zona={zona} fontSize={13 / pxPerCm} />)}
    >
      {mapa.estantes.map((estante) => (
        <EstanteShape key={estante.id} estante={estante} zonaNombre="Zona A" pxPerCm={pxPerCm} onActivate={vi.fn()} />
      ))}
    </SalaSvg>,
  );
}

describe('Dibujo SVG de la sala (REQ-22)', () => {
  it('dibuja la sala con un viewBox en cm y margen para el muro', () => {
    renderMapa();
    const svg = screen.getByRole('group', { name: 'Plano de Laboratorio 206' });
    expect(svg.getAttribute('viewBox')).toBe('-30 -30 1060 660');
  });

  it('muestra zonas y estantes con su código', () => {
    renderMapa();
    expect(screen.getByText('Zona A')).toBeDefined();
    expect(screen.getByText('Zona B')).toBeDefined();
    expect(screen.getByText('EST-A1')).toBeDefined();
    expect(screen.getByText('EST-B1')).toBeDefined();
  });

  it('cada estante es un botón con su descripción accesible', () => {
    renderMapa();
    expect(
      screen.getByRole('button', { name: 'Estante EST-A2, Zona A, 2 cajones, 5 elementos, con stock crítico' }),
    ).toBeDefined();
  });

  it('gira el texto de los estantes verticales y dibuja una celda por cajón', () => {
    const { container } = render(
      <svg>
        <EstanteShape estante={makeEstante()} zonaNombre={null} pxPerCm={1} onActivate={vi.fn()} />
      </svg>,
    );
    const text = screen.getByText('EST-A1');
    expect(text.getAttribute('transform')).toContain('rotate(-90)');
    // Marco + línea de la franja + 1 separación entre dos cajones.
    expect(container.querySelectorAll('line')).toHaveLength(2);
  });

  it('oculta el código si no cabe a esa escala, pero lo deja en el nombre accesible', () => {
    const { container } = render(
      <svg>
        <EstanteShape estante={makeEstante({ width: 40, depth: 20 })} zonaNombre={null} pxPerCm={0.2} onActivate={vi.fn()} />
      </svg>,
    );
    expect(container.querySelector('text')).toBeNull();
    expect(screen.getByRole('button', { name: /Estante EST-A1/ })).toBeDefined();
  });

  it('marca el stock crítico con un punto de peligro', () => {
    const { container } = render(
      <svg>
        <EstanteShape estante={makeEstante({ has_critical_stock: true })} zonaNombre={null} pxPerCm={1} onActivate={vi.fn()} />
      </svg>,
    );
    expect(container.querySelector('circle.fill-danger')).not.toBeNull();
  });
});
