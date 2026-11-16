import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiRequestError } from '@sgia/api-client';

import { OracleCategorySelect } from './components/oracle-category-select';

const mutateAsync = vi.fn();

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useOracleCategories: () => ({
    data: [
      { id: 1, name: 'ACTIVO FIJO' },
      { id: 2, name: 'INSUMOS.MATERIALES' },
    ],
    isLoading: false,
  }),
  useCreateOracleCategory: () => ({ mutateAsync, isPending: false }),
}));

describe('OracleCategorySelect', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra las categorías y el valor guardado al editar', () => {
    render(<OracleCategorySelect id="oc" value={2} onChange={vi.fn()} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('2');
    expect(screen.getByRole('option', { name: 'ACTIVO FIJO' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Sin categoría' })).toBeTruthy();
    expect(screen.getByRole('option', { name: '+ Agregar nueva…' })).toBeTruthy();
  });

  it('permite dejarla vacía (campo opcional)', async () => {
    const onChange = vi.fn();
    render(<OracleCategorySelect id="oc" value={1} onChange={onChange} />);

    await userEvent.selectOptions(screen.getByRole('combobox'), '');
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('agrega una categoría nueva y la deja seleccionada', async () => {
    const onChange = vi.fn();
    mutateAsync.mockResolvedValue({ id: 9, name: 'TI.EQUIPOS DE RED' });
    render(<OracleCategorySelect id="oc" value={null} onChange={onChange} />);

    await userEvent.selectOptions(screen.getByRole('combobox'), '+ Agregar nueva…');
    await userEvent.type(screen.getByRole('textbox'), 'ti.equipos de red{Enter}');

    expect(mutateAsync).toHaveBeenCalledWith({ name: 'ti.equipos de red' });
    expect(onChange).toHaveBeenCalledWith(9);
    expect(screen.getByRole('combobox')).toBeTruthy();
  });

  it('muestra el error del backend si la categoría ya existe', async () => {
    mutateAsync.mockRejectedValue(
      new ApiRequestError(422, {
        message: 'Esa descripción de categoría ya existe.',
        errors: { name: ['Esa descripción de categoría ya existe.'] },
      }),
    );
    render(<OracleCategorySelect id="oc" value={null} onChange={vi.fn()} />);

    await userEvent.selectOptions(screen.getByRole('combobox'), '+ Agregar nueva…');
    await userEvent.type(screen.getByRole('textbox'), 'activo fijo');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar categoría' }));

    expect(await screen.findByText('Esa descripción de categoría ya existe.')).toBeTruthy();
    expect(screen.getByRole('textbox')).toBeTruthy();
  });
});
