import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { StudentLookup } from './components/student-lookup';
import { studentBorrowerPayload } from './lib/student-borrower';
import { studentFormSchema } from './lib/student-form-schema';

let lookupResult: { data: unknown; isFetching: boolean; isError: boolean; error: unknown } = {
  data: undefined,
  isFetching: false,
  isError: false,
  error: null,
};
const lookupSpy = vi.fn();

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useStudentByRut: (rut?: string) => {
    lookupSpy(rut);
    return rut ? lookupResult : { data: undefined, isFetching: false, isError: false, error: null };
  },
}));

describe('StudentLookup (REQ-20)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lookupResult = { data: undefined, isFetching: false, isError: false, error: null };
  });

  it('rechaza un RUT con dígito verificador inválido sin consultar', async () => {
    const user = userEvent.setup();
    render(<StudentLookup onChange={vi.fn()} />);
    await user.type(screen.getByLabelText(/RUT del estudiante/i), '12345678-9{Enter}');
    expect(await screen.findByRole('alert')).toBeDefined();
    expect(lookupSpy).not.toHaveBeenCalledWith('12345678-9');
  });

  it('200: muestra al estudiante y entrega el borrower existente', async () => {
    lookupResult = {
      data: { id: 7, rut: '12345678-5', full_name: 'Ana Pérez', career: { name: 'Informática' } },
      isFetching: false,
      isError: false,
      error: null,
    };
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<StudentLookup onChange={onChange} />);
    await user.type(screen.getByLabelText(/RUT del estudiante/i), '12.345.678-5{Enter}');

    expect(await screen.findByText('Ana Pérez')).toBeDefined();
    expect(lookupSpy).toHaveBeenCalledWith('12345678-5');
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ kind: 'existing', student: expect.objectContaining({ id: 7 }) }),
      ),
    );
  });

  it('404: pide el nombre y entrega un RUT nuevo', async () => {
    lookupResult = { data: null, isFetching: false, isError: false, error: null };
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<StudentLookup onChange={onChange} />);
    await user.type(screen.getByLabelText(/RUT del estudiante/i), '98765432-5{Enter}');
    await user.type(await screen.findByLabelText(/Nombre \(opcional\)/i), 'Luis');

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith({ kind: 'new', rut: '98765432-5', name: 'Luis' }),
    );
  });
});

describe('studentBorrowerPayload y esquema', () => {
  it('existente → solo student_id; nuevo → student_rut y nombre si lo hay', () => {
    expect(
      studentBorrowerPayload({ kind: 'existing', student: { id: 7, rut: '12345678-5' } }),
    ).toEqual({ student_id: 7 });
    expect(studentBorrowerPayload({ kind: 'new', rut: '98765432-5', name: ' Luis ' })).toEqual({
      student_rut: '98765432-5',
      borrower_name: 'Luis',
    });
    expect(studentBorrowerPayload({ kind: 'new', rut: '98765432-5', name: '' })).toEqual({
      student_rut: '98765432-5',
    });
  });

  it('el formulario valida el RUT con dígito verificador', () => {
    const base = { full_name: '', email: '', career_id: null };
    expect(studentFormSchema.safeParse({ ...base, rut: '12.345.678-5' }).success).toBe(true);
    expect(studentFormSchema.safeParse({ ...base, rut: '12.345.678-4' }).success).toBe(false);
    expect(studentFormSchema.safeParse({ ...base, rut: '12345678-5', email: 'x' }).success).toBe(false);
  });
});
