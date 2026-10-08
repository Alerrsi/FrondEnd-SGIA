import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { Toggle } from './toggle';

describe('Liquid Toggle Component (REQ-DISEÑO)', () => {
  it('renders switch with role="switch" and correct aria attributes', () => {
    render(<Toggle checked={false} aria-label="Modo oscuro" />);
    const sw = screen.getByRole('switch', { name: 'Modo oscuro' });
    expect(sw).toBeDefined();
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(sw.getAttribute('data-on')).toBe('false');
  });

  it('toggles when clicked in uncontrolled mode and invokes callback', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Toggle
        defaultChecked={false}
        onCheckedChange={handleChange}
        aria-label="Alternar tema"
      />,
    );

    const sw = screen.getByRole('switch', { name: 'Alternar tema' });
    await user.click(sw);

    expect(handleChange).toHaveBeenCalledWith(true);
    expect(sw.getAttribute('aria-checked')).toBe('true');
  });

  it('functions as a controlled switch', async () => {
    const user = userEvent.setup();

    function ControlledTest() {
      const [checked, setChecked] = useState(false);
      return (
        <Toggle
          checked={checked}
          onCheckedChange={setChecked}
          aria-label="Controlado"
        />
      );
    }

    render(<ControlledTest />);
    const sw = screen.getByRole('switch', { name: 'Controlado' });
    expect(sw.getAttribute('aria-checked')).toBe('false');

    await user.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('true');
  });

  it('triggers on Space and Enter keys', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Toggle
        defaultChecked={false}
        onCheckedChange={handleChange}
        aria-label="Teclado"
      />,
    );

    const sw = screen.getByRole('switch', { name: 'Teclado' });
    sw.focus();
    await user.keyboard(' ');
    expect(handleChange).toHaveBeenCalledWith(true);

    await user.keyboard('{Enter}');
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('applies compact size="sm" attributes without overflowing', () => {
    render(<Toggle size="sm" aria-label="Compacto" />);
    const sw = screen.getByRole('switch', { name: 'Compacto' });
    expect(sw.getAttribute('data-size')).toBe('sm');
    expect(sw.style.width).toBe('46px');
    expect(sw.style.height).toBe('24px');
  });
});
