import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Producto } from '@sgia/types';

import { ReubicarProductoModal } from './components/reubicar-producto-modal';

const mockMutateAsync = vi.fn();

vi.mock('@sgia/api-client', () => ({
  useUpdateProductLocation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useLocations: () => ({
    data: {
      data: [
        { id: 1, nombre: 'Pañol Central', tipo: 'panol', cajones_count: 2 },
        { id: 2, nombre: 'Laboratorio Redes', tipo: 'sala', cajones_count: 1 },
      ],
    },
    isLoading: false,
  }),
  useCajones: (params?: { location_id?: number }) => {
    if (params?.location_id === 1) {
      return {
        data: {
          data: [
            { id: 101, codigo: 'Cajón A-1', descripcion: 'Componentes pasivos', location_id: 1 },
            { id: 102, codigo: 'Estante 3', descripcion: 'Switches', location_id: 1 },
          ],
        },
        isLoading: false,
      };
    }
    return {
      data: { data: [] },
      isLoading: false,
    };
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockProduct: Producto = {
  id: 42,
  nombre: 'Patch Cord Cat 6 3m',
  name: 'Patch Cord Cat 6 3m',
  codigoBarras: 'SGIA-CABLE-001',
  categoria: 'Redes',
  stock: 25,
  stockCritico: 5,
  area: 'Telecomunicaciones',
  activo: true,
  ubicacion: {
    id: 1,
    sala: 'Pañol Central',
    cajon: 'Cajón A-1',
    descripcion: 'Gaveta superior',
  },
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z',
};

describe('ReubicarProductoModal (REQ-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({
      id: 42,
      sala: 'Pañol Central',
      cajon: 'Estante 3',
    });
  });

  it('renders existing location and loads API options in dropdowns', () => {
    render(
      <ReubicarProductoModal
        open={true}
        onClose={vi.fn()}
        producto={mockProduct}
      />,
    );

    // Title and product reference
    expect(screen.getByText(/Reubicar producto en pañol/i)).toBeDefined();
    expect(screen.getByText(/Patch Cord Cat 6 3m/i)).toBeDefined();

    // Displays current registered location
    expect(screen.getByText(/Pañol Central · Cajón A-1/i)).toBeDefined();

    // Dropdown contains options from mockLocations
    const salaSelect = screen.getByLabelText(/1\. Sala o Almacén principal/i);
    expect(salaSelect).toBeDefined();
    expect(screen.getByRole('option', { name: /Pañol Central/i })).toBeDefined();
    expect(screen.getByRole('option', { name: /Laboratorio Redes/i })).toBeDefined();
  });

  it('submits relocation using API dropdowns (location_id and cajon_id)', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <ReubicarProductoModal
        open={true}
        onClose={handleClose}
        producto={mockProduct}
      />,
    );

    const salaSelect = screen.getByLabelText(/1\. Sala o Almacén principal/i);
    await user.selectOptions(salaSelect, '1');

    const cajonSelect = screen.getByLabelText(/2\. Cajón, Estante o Gaveta/i);
    await user.selectOptions(cajonSelect, '102');

    const submitBtn = screen.getByRole('button', { name: /Confirmar reubicación/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: 42,
        payload: {
          location_id: 1,
          cajon_id: 102,
          descripcion: 'Gaveta superior',
        },
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('allows switching to manual mode and submitting custom sala and cajon', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <ReubicarProductoModal
        open={true}
        onClose={handleClose}
        producto={mockProduct}
      />,
    );

    // Toggle manual mode
    const toggleBtn = screen.getByRole('button', { name: /Entrada manual/i });
    await user.click(toggleBtn);

    const salaInput = screen.getByLabelText(/Nombre de la Sala/i);
    const cajonInput = screen.getByLabelText(/Código de Cajón \/ Estante/i);

    await user.clear(salaInput);
    await user.type(salaInput, 'Taller Mecatrónica');

    await user.clear(cajonInput);
    await user.type(cajonInput, 'Armario 2');

    const submitBtn = screen.getByRole('button', { name: /Confirmar reubicación/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: 42,
        payload: {
          sala: 'Taller Mecatrónica',
          cajon: 'Armario 2',
          descripcion: 'Gaveta superior',
        },
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
