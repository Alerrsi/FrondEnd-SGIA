import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { ApiRequestError } from '@sgia/api-client';

import { LoanRequestForm } from './components/loan-request-form';

const mutateAsync = vi.fn();
const locationsSpy = vi.fn();

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 5, nombre: 'Ana Docente', rol: 'PRO-01', storeroom_id: 1 },
  }),
}));

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useCreatePrestamo: () => ({ mutateAsync, isPending: false }),
  useCareers: () => ({
    data: { data: [{ id: 3, name: 'Informática', code: 'ISD' }] },
  }),
  useStorerooms: () => ({
    data: {
      data: [
        { id: 1, name: 'Pañol Temuco' },
        { id: 2, name: 'Pañol Norte' },
      ],
    },
  }),
  useLocations: (params: unknown) => {
    locationsSpy(params);
    return {
      data: {
        data: [
          { id: 12, nombre: 'Laboratorio 3', tipo: 'sala' },
          { id: 13, nombre: 'Taller 1', tipo: 'taller' },
          { id: 14, nombre: 'Bodega central', tipo: 'bodega' },
        ],
      },
    };
  },
  useProducts: () => ({
    data: {
      data: [
        { id: 45, nombre: 'Cable UTP', barcode: 'INS-1', stock: 10 },
        { id: 46, nombre: 'Switch', barcode: 'EQ-2', stock: 0 },
      ],
    },
    isLoading: false,
    isError: false,
  }),
}));

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/profesor/catalogo']}>
      <Routes>
        <Route path="/profesor/catalogo" element={<LoanRequestForm />} />
        <Route path="/profesor/solicitudes" element={<div>Pantalla solicitudes</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoanRequestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsync.mockResolvedValue({ id: 9, codigo: 'REM-2026-ABC123' });
  });

  it('muestra al profesor de solo lectura y el pañol por defecto', () => {
    renderForm();
    expect((screen.getByLabelText('Profesor') as HTMLInputElement).value).toBe('Ana Docente');
    expect((screen.getByLabelText('Pañol a solicitar') as HTMLSelectElement).value).toBe('1');
  });

  it('el catálogo oculta productos sin stock y los laboratorios excluyen bodegas', () => {
    renderForm();
    expect(screen.getByText('Cable UTP')).toBeDefined();
    expect(screen.queryByText('Switch')).toBeNull();
    expect(screen.getByRole('option', { name: 'Laboratorio 3' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Taller 1' })).toBeDefined();
    expect(screen.queryByRole('option', { name: 'Bodega central' })).toBeNull();
  });

  it('no envía y muestra los errores si faltan datos', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: /enviar solicitud/i }));

    expect(await screen.findByText('Selecciona la carrera.')).toBeDefined();
    expect(screen.getByText('Indica la asignatura.')).toBeDefined();
    expect(screen.getByText('Selecciona el laboratorio.')).toBeDefined();
    expect(screen.getByText('Agrega al menos un insumo.')).toBeDefined();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('valida la hora de término y la cantidad máxima', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: 'Agregar Cable UTP' }));
    await user.clear(screen.getByLabelText('Cantidad de Cable UTP'));
    await user.type(screen.getByLabelText('Cantidad de Cable UTP'), '11');
    await user.type(screen.getByLabelText('Hora inicio'), '10:00');
    await user.type(screen.getByLabelText('Hora término'), '09:00');
    await user.click(screen.getByRole('button', { name: /enviar solicitud/i }));

    expect(
      await screen.findByText('La hora de término debe ser posterior a la de inicio.'),
    ).toBeDefined();
    expect(screen.getByText('Solo hay 10 disponibles.')).toBeDefined();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('envía la solicitud completa y vuelve a Mis solicitudes', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText('Carrera'), '3');
    await user.type(screen.getByLabelText('Asignatura'), 'Redes');
    await user.type(screen.getByLabelText('Hora inicio'), '08:30');
    await user.type(screen.getByLabelText('Hora término'), '10:00');
    await user.selectOptions(screen.getByLabelText('Laboratorio'), '12');
    await user.click(screen.getByRole('button', { name: 'Agregar Cable UTP' }));
    await user.clear(screen.getByLabelText('Cantidad de Cable UTP'));
    await user.type(screen.getByLabelText('Cantidad de Cable UTP'), '3');
    await user.click(screen.getByRole('button', { name: /enviar solicitud/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        career_id: 3,
        subject: 'Redes',
        start_time: '08:30',
        end_time: '10:00',
        storeroom_id: 1,
        location_id: 12,
        items: [{ product_id: 45, quantity: 3 }],
      }),
    );
    expect(await screen.findByText('Pantalla solicitudes')).toBeDefined();
  });

  it('se puede quitar un insumo agregado', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: 'Agregar Cable UTP' }));
    expect(screen.getByLabelText('Cantidad de Cable UTP')).toBeDefined();
    await user.click(screen.getByRole('button', { name: 'Quitar Cable UTP' }));
    expect(screen.queryByLabelText('Cantidad de Cable UTP')).toBeNull();
  });

  it('muestra el 422 del backend junto a cada campo (stock del pañol y laboratorio)', async () => {
    const stock =
      'Stock insuficiente para "Cable UTP" en Pañol Temuco: se solicitaron 3 y hay 1 disponibles.';
    mutateAsync.mockRejectedValueOnce(
      new ApiRequestError(422, {
        message: stock,
        errors: {
          'items.0.quantity': [stock],
          location_id: ['El laboratorio no pertenece al pañol indicado.'],
        },
      }),
    );
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText('Carrera'), '3');
    await user.type(screen.getByLabelText('Asignatura'), 'Redes');
    await user.type(screen.getByLabelText('Hora inicio'), '08:30');
    await user.type(screen.getByLabelText('Hora término'), '10:00');
    await user.selectOptions(screen.getByLabelText('Laboratorio'), '12');
    await user.click(screen.getByRole('button', { name: 'Agregar Cable UTP' }));
    await user.clear(screen.getByLabelText('Cantidad de Cable UTP'));
    await user.type(screen.getByLabelText('Cantidad de Cable UTP'), '3');
    await user.click(screen.getByRole('button', { name: /enviar solicitud/i }));

    expect(await screen.findByText(stock)).toBeDefined();
    expect(screen.getByText('El laboratorio no pertenece al pañol indicado.')).toBeDefined();
    expect(screen.queryByText('Pantalla solicitudes')).toBeNull();
  });

  it('envía el vencimiento opcional y rechaza uno anterior a la actividad', async () => {
    const user = userEvent.setup();
    renderForm();
    const date = screen.getByLabelText('Fecha de actividad') as HTMLInputElement;
    await user.clear(date);
    await user.type(date, '2999-11-12');
    const due = screen.getByLabelText('Devolución (opcional)');
    await user.type(due, '2999-11-10');
    await user.click(screen.getByRole('button', { name: /enviar solicitud/i }));

    expect(
      await screen.findByText('El vencimiento no puede ser anterior a la fecha de la actividad.'),
    ).toBeDefined();
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
