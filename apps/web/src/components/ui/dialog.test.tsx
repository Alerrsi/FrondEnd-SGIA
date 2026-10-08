import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { Dialog, DialogCloseButton } from './dialog';

describe('Dialog Unsaved Changes Confirmation (REQ-DISEÑO)', () => {
  it('cierra inmediatamente sin confirmación cuando no hay datos escritos (hasUnsavedChanges = false)', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Dialog
        open={true}
        onClose={handleClose}
        title="Formulario Limpio"
        hasUnsavedChanges={false}
      >
        <p>Contenido sin cambios</p>
        <DialogCloseButton>Cancelar</DialogCloseButton>
      </Dialog>,
    );

    expect(screen.getByText('Formulario Limpio')).toBeDefined();

    // Clic en botón "Cancelar"
    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(cancelBtn);

    // Debe llamar onClose directamente
    expect(handleClose).toHaveBeenCalledTimes(1);
    // No debe aparecer diálogo de confirmación
    expect(screen.queryByText('¿Descartar cambios?')).toBeNull();
  });

  it('cierra inmediatamente sin confirmación mediante el botón X si no hay cambios', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Dialog
        open={true}
        onClose={handleClose}
        title="Modal Limpio"
        hasUnsavedChanges={false}
      >
        <p>Contenido</p>
      </Dialog>,
    );

    const closeBtn = screen.getByRole('button', { name: /Cerrar modal/i });
    await user.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('¿Descartar cambios?')).toBeNull();
  });

  it('muestra diálogo de confirmación si hay datos escritos (hasUnsavedChanges = true) y cancela cierre al hacer "Seguir editando"', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Dialog
        open={true}
        onClose={handleClose}
        title="Formulario Modificado"
        hasUnsavedChanges={true}
      >
        <input defaultValue="Texto ingresado por el usuario" />
        <DialogCloseButton>Cancelar</DialogCloseButton>
      </Dialog>,
    );

    // Clic en botón de salir/cancelar
    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(cancelBtn);

    // NO debe haber cerrado aún
    expect(handleClose).not.toHaveBeenCalled();

    // Debe mostrar la confirmación
    expect(screen.getByText('¿Descartar cambios?')).toBeDefined();
    expect(
      screen.getByText(
        'Tienes datos escritos en el formulario. Si sales ahora, se perderán los cambios ingresados.',
      ),
    ).toBeDefined();

    // Clic en "Seguir editando"
    const continueBtn = screen.getByRole('button', { name: /Seguir editando/i });
    await user.click(continueBtn);

    // Modal sigue abierto y handleClose nunca fue invocado
    expect(handleClose).not.toHaveBeenCalled();
    expect(screen.queryByText('¿Descartar cambios?')).toBeNull();
    expect(screen.getByText('Formulario Modificado')).toBeDefined();
  });

  it('permite descartar y salir si el usuario confirma en el sub-diálogo', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Dialog
        open={true}
        onClose={handleClose}
        title="Edición de Producto"
        hasUnsavedChanges={true}
      >
        <p>Campos con cambios</p>
      </Dialog>,
    );

    // Intentar cerrar con la X
    const closeBtn = screen.getByRole('button', { name: /Cerrar modal/i });
    await user.click(closeBtn);

    expect(handleClose).not.toHaveBeenCalled();
    expect(screen.getByText('¿Descartar cambios?')).toBeDefined();

    // Confirmar descarte
    const discardBtn = screen.getByRole('button', { name: /Descartar y salir/i });
    await user.click(discardBtn);

    // Ahora sí se cerró
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('evalúa dinámicamente hasUnsavedChanges como función', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    function TestComponent() {
      const [text, setText] = useState('');
      return (
        <Dialog
          open={true}
          onClose={handleClose}
          title="Prueba Dinámica"
          hasUnsavedChanges={() => text.trim().length > 0}
        >
          <input
            data-testid="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <DialogCloseButton>Cancelar</DialogCloseButton>
        </Dialog>
      );
    }

    render(<TestComponent />);

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });

    // 1. Inicialmente limpio: se cierra sin confirmar
    await user.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('¿Descartar cambios?')).toBeNull();

    // 2. Escribir datos
    handleClose.mockClear();
    const input = screen.getByTestId('input');
    await user.type(input, 'Cambio no guardado');

    // Intentar cancelar con datos escritos: debe interceptar
    await user.click(cancelBtn);
    expect(handleClose).not.toHaveBeenCalled();
    expect(screen.getByText('¿Descartar cambios?')).toBeDefined();
  });
});
