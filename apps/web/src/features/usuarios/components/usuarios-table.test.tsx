import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UsuarioSinPassword } from '@sgia/types';

import { UsuariosTable } from './usuarios-table';

const mockUsuarios: UsuarioSinPassword[] = [
  {
    id: 1,
    run: '11111111-1',
    nombre: 'Admin Principal',
    name: 'Admin Principal',
    email: 'admin@sgia.cl',
    rol: 'AD-01',
    role: 'AD-01',
    area: 'Informática',
    activo: true,
    is_active: true,
    createdAt: '2026-09-25T10:00:00Z',
    created_at: '2026-09-25T10:00:00Z',
    updatedAt: '2026-09-25T10:00:00Z',
    updated_at: '2026-09-25T10:00:00Z',
  },
  {
    id: 2,
    run: '22222222-2',
    nombre: 'Profesor Juan',
    name: 'Profesor Juan',
    email: 'juan@sgia.cl',
    rol: 'PRO-01',
    role: 'PRO-01',
    area: 'Ciberseguridad',
    activo: false,
    is_active: false,
    createdAt: '2026-10-01T12:00:00Z',
    created_at: '2026-10-01T12:00:00Z',
    updatedAt: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
  },
];

describe('UsuariosTable', () => {
  it('renders users list, badges, and RUNs correctly', () => {
    render(
      <UsuariosTable
        usuarios={mockUsuarios}
        onEdit={vi.fn()}
        onToggleActivo={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toBeDefined();
    expect(rows[2]).toBeDefined();

    // Header is row 0, first user is row 1
    const adminRow = within(rows[1]!);
    expect(adminRow.getByText('Admin Principal')).toBeDefined();
    expect(adminRow.getByText('admin@sgia.cl')).toBeDefined();
    expect(adminRow.getByText('Administrador')).toBeDefined();
    expect(adminRow.getByText('activo')).toBeDefined();

    // Second user is row 2
    const profRow = within(rows[2]!);
    expect(profRow.getByText('Profesor Juan')).toBeDefined();
    expect(profRow.getByText('juan@sgia.cl')).toBeDefined();
    expect(profRow.getByText('Profesor')).toBeDefined();
    expect(profRow.getByText('inactivo')).toBeDefined();
  });

  it('prevents self-deletion and self-deactivation when currentUserId matches', () => {
    render(
      <UsuariosTable
        usuarios={mockUsuarios}
        currentUserId={1}
        onEdit={vi.fn()}
        onToggleActivo={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    // Admin Principal (id: 1) buttons must be disabled
    const selfToggleBtn = screen.getByRole('button', {
      name: 'No puedes desactivar tu propia cuenta',
    });
    expect((selfToggleBtn as HTMLButtonElement).disabled).toBe(true);

    const selfDeleteBtn = screen.getByRole('button', {
      name: 'No puedes eliminar tu propia cuenta',
    });
    expect((selfDeleteBtn as HTMLButtonElement).disabled).toBe(true);

    // Other user (id: 2) buttons must be enabled
    const otherToggleBtn = screen.getByRole('button', {
      name: 'Activar a Profesor Juan',
    });
    expect((otherToggleBtn as HTMLButtonElement).disabled).toBe(false);

    const otherDeleteBtn = screen.getByRole('button', {
      name: 'Eliminar a Profesor Juan',
    });
    expect((otherDeleteBtn as HTMLButtonElement).disabled).toBe(false);
  });

  it('calls onEdit, onToggleActivo, and onDelete callbacks', async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();
    const handleToggle = vi.fn();
    const handleDelete = vi.fn();

    render(
      <UsuariosTable
        usuarios={mockUsuarios}
        currentUserId={1}
        onEdit={handleEdit}
        onToggleActivo={handleToggle}
        onDelete={handleDelete}
      />,
    );

    const editBtn = screen.getByRole('button', { name: 'Editar a Profesor Juan' });
    await user.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(mockUsuarios[1]);

    const toggleBtn = screen.getByRole('button', { name: 'Activar a Profesor Juan' });
    await user.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledWith(mockUsuarios[1]);

    const deleteBtn = screen.getByRole('button', { name: 'Eliminar a Profesor Juan' });
    await user.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(mockUsuarios[1]);
  });

  it('handles search input and filter changes', async () => {
    const user = userEvent.setup();
    const handleSearchChange = vi.fn();
    const handleRoleChange = vi.fn();
    const handleEstadoChange = vi.fn();

    render(
      <UsuariosTable
        usuarios={mockUsuarios}
        search="profesor"
        onSearchChange={handleSearchChange}
        onRolFilterChange={handleRoleChange}
        onEstadoFilterChange={handleEstadoChange}
        onEdit={vi.fn()}
        onToggleActivo={vi.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Buscar por nombre o correo…');
    expect(searchInput).toBeDefined();

    const roleSelect = screen.getByLabelText('Filtrar por rol');
    await user.selectOptions(roleSelect, 'PRO-01');
    expect(handleRoleChange).toHaveBeenCalledWith('PRO-01');

    const estadoSelect = screen.getByLabelText('Filtrar por estado');
    await user.selectOptions(estadoSelect, 'activo');
    expect(handleEstadoChange).toHaveBeenCalledWith('activo');
  });

  it('renders empty state message when list is empty', () => {
    render(
      <UsuariosTable
        usuarios={[]}
        onEdit={vi.fn()}
        onToggleActivo={vi.fn()}
      />,
    );

    expect(
      screen.getByText('No se encontraron usuarios con los filtros aplicados.'),
    ).toBeDefined();
  });
});
