import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChangePasswordDialog } from './change-password-dialog';

const mutateAsync = vi.fn();

vi.mock('@sgia/api-client', () => ({
  useChangePassword: () => ({ mutateAsync, isPending: false }),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

async function fill(current: string, next: string, confirm: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Contraseña actual'), current);
  await user.type(screen.getByLabelText('Contraseña nueva'), next);
  await user.type(screen.getByLabelText('Confirmar contraseña nueva'), confirm);
  await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
}

describe('ChangePasswordDialog', () => {
  beforeEach(() => mutateAsync.mockReset());

  it('rechaza una confirmación distinta sin llamar a la API', async () => {
    render(<ChangePasswordDialog open onClose={vi.fn()} />);
    await fill('Vieja1234', 'Nueva1234', 'Otra1234');

    expect(await screen.findByText('La confirmación no coincide.')).toBeDefined();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('envía el payload y cierra al tener éxito', async () => {
    mutateAsync.mockResolvedValue({ message: 'ok' });
    const onClose = vi.fn();
    render(<ChangePasswordDialog open onClose={onClose} />);
    await fill('Vieja1234', 'Nueva1234', 'Nueva1234');

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith({
      current_password: 'Vieja1234',
      password: 'Nueva1234',
      password_confirmation: 'Nueva1234',
    });
  });
});
