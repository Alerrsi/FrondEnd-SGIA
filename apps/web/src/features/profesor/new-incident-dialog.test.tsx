import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NewIncidentDialog } from './components/new-incident-dialog';

const mutateAsync = vi.fn();

vi.mock('@sgia/api-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sgia/api-client')>()),
  useCreateIncidentReport: () => ({ mutateAsync, isPending: false }),
  useLocations: () => ({ data: { data: [{ id: 3, nombre: 'Laboratorio 3' }] } }),
}));

// El lienzo no existe en happy-dom: se reemplaza por un botón que "firma".
vi.mock('./components/signature-pad', () => ({
  SignaturePad: ({ onChange }: { onChange: (v: string) => void }) => (
    <button type="button" onClick={() => onChange('data:image/png;base64,AAAA')}>
      Firmar
    </button>
  ),
}));

describe('NewIncidentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsync.mockResolvedValue({ id: 1, code: 'NOV-0001' });
  });

  it('no envía y muestra los errores si faltan datos', async () => {
    const user = userEvent.setup();
    render(<NewIncidentDialog open onClose={vi.fn()} onCreated={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /enviar informe/i }));

    expect(await screen.findByText('Indica el nombre de la asignatura.')).toBeDefined();
    expect(screen.getByText('Selecciona el laboratorio.')).toBeDefined();
    expect(screen.getByText('Marca al menos un tipo de problema.')).toBeDefined();
    expect(screen.getByText('Falta la firma del docente.')).toBeDefined();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('exige describir el problema marcado', async () => {
    const user = userEvent.setup();
    render(<NewIncidentDialog open onClose={vi.fn()} onCreated={vi.fn()} />);
    await user.click(screen.getByLabelText(/falla de equipos/i));
    await user.click(screen.getByRole('button', { name: /enviar informe/i }));

    expect(await screen.findByText('Describe el problema marcado.')).toBeDefined();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('envía el informe completo y avisa el código', async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    const onClose = vi.fn();
    render(<NewIncidentDialog open onClose={onClose} onCreated={onCreated} />);

    await user.type(screen.getByLabelText('Asignatura'), 'Redes');
    await user.selectOptions(screen.getByLabelText('Laboratorio'), '3');
    await user.click(screen.getByLabelText(/falla de equipos/i));
    await user.type(screen.getByLabelText(/Descripción: Falla de equipos/i), 'No enciende');
    await user.click(screen.getByRole('button', { name: 'Firmar' }));
    await user.click(screen.getByRole('button', { name: /enviar informe/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Redes',
        location_id: 3,
        problems: [{ type: 'falla_equipo', description: 'No enciende' }],
        signature: 'data:image/png;base64,AAAA',
      }),
    );
    expect(onCreated).toHaveBeenCalledWith('NOV-0001');
    expect(onClose).toHaveBeenCalled();
  });
});
