import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PaginatedResponse, UsuarioSinPassword } from '@sgia/types';

import UsuariosPage from './pages/usuarios-page';

const mockAdminUser: UsuarioSinPassword = {
  id: 1,
  run: '11111111-1',
  nombre: 'Admin Principal',
  email: 'admin@sgia.cl',
  rol: 'AD-01',
  area: 'Informática',
  activo: true,
  createdAt: '2026-09-25T10:00:00Z',
  updatedAt: '2026-09-25T10:00:00Z',
};

const mockTeacherUser: UsuarioSinPassword = {
  id: 2,
  run: '22222222-2',
  nombre: 'Profesor Carlos',
  email: 'carlos@inacap.cl',
  rol: 'PRO-01',
  area: 'Redes',
  activo: true,
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
};

const mockUsersResponse: PaginatedResponse<UsuarioSinPassword> = {
  data: [mockAdminUser, mockTeacherUser],
  meta: {
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 2,
  },
};

const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();
const mockToggleMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    user: mockAdminUser,
    token: 'test-token',
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@sgia/api-client', () => ({
  useUsers: () => ({
    data: mockUsersResponse,
    isLoading: false,
    isError: false,
    isFetching: false,
  }),
  useCreateUsuario: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  }),
  useUpdateUsuario: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
  useToggleUsuarioActivo: () => ({
    mutateAsync: mockToggleMutateAsync,
    isPending: false,
  }),
  useDeleteUsuario: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
}));

describe('REQ-02: Ciclo de vida de administración de usuarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite abrir el modal y dar de alta un nuevo usuario con validación de RUN y correo', async () => {
    const user = userEvent.setup();
    render(<UsuariosPage />);

    // Abrir formulario
    const createBtn = screen.getByRole('button', { name: /nuevo usuario/i });
    await user.click(createBtn);

    expect(screen.getByText('Crea una cuenta de acceso para el panel web o la app móvil.')).toBeDefined();

    // Llenar campos
    const runInput = screen.getByPlaceholderText('12.345.678-9');
    const nameInput = screen.getByPlaceholderText('Nombre Apellido');
    const emailInput = screen.getByPlaceholderText('usuario@inacap.cl');
    const areaInput = screen.getByPlaceholderText('Informática, Telecomunicaciones, etc.');
    const passwordInput = screen.getByPlaceholderText('Mínimo 8 caracteres');
    const roleSelect = screen.getByLabelText('Rol');

    await user.type(runInput, '12.345.678-5');
    await user.type(nameInput, 'Pañolero Nuevo');
    await user.type(emailInput, 'panol.nuevo@inacap.cl');
    await user.type(areaInput, 'Pañol Central');
    await user.type(passwordInput, 'Secret1234!');
    await user.selectOptions(roleSelect, 'PAN-01');

    mockCreateMutateAsync.mockResolvedValueOnce({
      id: 3,
      run: '12345678-5',
      nombre: 'Pañolero Nuevo',
      email: 'panol.nuevo@inacap.cl',
      rol: 'PAN-01',
      activo: true,
    });

    const submitBtn = screen.getByRole('button', { name: 'Crear usuario' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          run: '12345678-5',
          nombre: 'Pañolero Nuevo',
          email: 'panol.nuevo@inacap.cl',
          rol: 'PAN-01',
          area: 'Pañol Central',
          password: 'Secret1234!',
        }),
      );
    });
  });

  it('permite editar un usuario existente manteniendo el RUN inmutable y enviando los cambios', async () => {
    const user = userEvent.setup();
    render(<UsuariosPage />);

    // Click en editar al usuario Profesor Carlos
    const editBtn = screen.getByRole('button', { name: 'Editar a Profesor Carlos' });
    await user.click(editBtn);

    expect(screen.getByText('Editar usuario')).toBeDefined();

    // El input de RUN debe estar deshabilitado en edición
    const runInput = screen.getByPlaceholderText('12.345.678-9') as HTMLInputElement;
    expect(runInput.disabled).toBe(true);

    // Modificar nombre y correo
    const nameInput = screen.getByPlaceholderText('Nombre Apellido');
    await user.clear(nameInput);
    await user.type(nameInput, 'Profesor Carlos Actualizado');

    const emailInput = screen.getByPlaceholderText('usuario@inacap.cl');
    await user.clear(emailInput);
    await user.type(emailInput, 'carlos.actualizado@inacap.cl');

    mockUpdateMutateAsync.mockResolvedValueOnce({
      ...mockTeacherUser,
      nombre: 'Profesor Carlos Actualizado',
      email: 'carlos.actualizado@inacap.cl',
    });

    const saveBtn = screen.getByRole('button', { name: 'Guardar cambios' });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: 2,
        payload: expect.objectContaining({
          nombre: 'Profesor Carlos Actualizado',
          email: 'carlos.actualizado@inacap.cl',
          rol: 'PRO-01',
        }),
      });
    });
  });

  it('muestra modal de confirmación antes de desactivar una cuenta de usuario y ejecuta la mutación', async () => {
    const user = userEvent.setup();
    render(<UsuariosPage />);

    const deactivateBtn = screen.getByRole('button', { name: 'Desactivar a Profesor Carlos' });
    await user.click(deactivateBtn);

    // Verifica que el diálogo de confirmación se abra con la advertencia
    expect(screen.getByText('Desactivar usuario')).toBeDefined();
    expect(
      screen.getByText(/El usuario perderá inmediatamente el acceso al sistema/i),
    ).toBeDefined();

    mockToggleMutateAsync.mockResolvedValueOnce({
      ...mockTeacherUser,
      activo: false,
    });

    const confirmBtn = screen.getByRole('button', { name: 'Desactivar' });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockToggleMutateAsync).toHaveBeenCalledWith({
        id: 2,
        activo: false,
      });
    });
  });

  it('muestra alerta crítica de eliminación irreversible y ejecuta deleteUsuario', async () => {
    const user = userEvent.setup();
    render(<UsuariosPage />);

    const deleteBtn = screen.getByRole('button', { name: 'Eliminar a Profesor Carlos' });
    await user.click(deleteBtn);

    // Verifica advertencia crítica de borrado
    expect(screen.getByText('Eliminar usuario permanentemente')).toBeDefined();
    expect(
      screen.getByText(/Esta acción es irreversible, revocará todos sus tokens y borrará su historial de sesiones/i),
    ).toBeDefined();

    mockDeleteMutateAsync.mockResolvedValueOnce(undefined);

    const confirmDeleteBtn = screen.getByRole('button', { name: 'Eliminar usuario' });
    await user.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith(2);
    });
  });

  it('garantiza que el administrador conectado no pueda auto-eliminarse ni auto-desactivarse en la UI', async () => {
    render(<UsuariosPage />);

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toBeDefined();
    const adminRow = within(rows[1]!); // Admin row

    const toggleSelfBtn = adminRow.getByRole('button', {
      name: 'No puedes desactivar tu propia cuenta',
    }) as HTMLButtonElement;
    expect(toggleSelfBtn.disabled).toBe(true);

    const deleteSelfBtn = adminRow.getByRole('button', {
      name: 'No puedes eliminar tu propia cuenta',
    }) as HTMLButtonElement;
    expect(deleteSelfBtn.disabled).toBe(true);
  });
});
