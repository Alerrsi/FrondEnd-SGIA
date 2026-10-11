import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UbicacionesPage from './ubicaciones-page';

vi.mock('@sgia/api-client', () => ({
  useLocations: () => ({
    data: {
      data: [
        { id: 1, nombre: 'Pañol Central', tipo: 'panol', descripcion: 'Piso 1' },
        { id: 2, nombre: 'Laboratorio 201', tipo: 'sala', descripcion: 'Piso 2' },
      ],
    },
    isLoading: false,
    refetch: vi.fn(),
  }),
  useCajones: (params?: { location_id?: number }) => ({
    data: {
      data:
        params?.location_id === 1
          ? [{ id: 10, codigo: 'Gaveta A-1', descripcion: 'Cables', location_id: 1 }]
          : [],
    },
    isLoading: false,
  }),
  useCreateLocation: () => ({ mutateAsync: vi.fn() }),
  useUpdateLocation: () => ({ mutateAsync: vi.fn() }),
  useDeleteLocation: () => ({ mutateAsync: vi.fn() }),
  useCreateCajon: () => ({ mutateAsync: vi.fn() }),
  useDeleteCajon: () => ({ mutateAsync: vi.fn() }),
}));

describe('UbicacionesPage (REQ-05)', () => {
  it('renders locations and cajones layout successfully', () => {
    render(<UbicacionesPage />);

    expect(screen.getByText(/Gestión de Ubicaciones Físicas y Cajones/i)).toBeDefined();
    expect(screen.getByText('Pañol Central')).toBeDefined();
    expect(screen.getByText('Laboratorio 201')).toBeDefined();
    expect(screen.getByText('Gaveta A-1')).toBeDefined();
  });
});
