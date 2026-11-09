import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NewIncidentDialog } from "./components/new-incident-dialog";

const mutateAsync = vi.fn();
let unitResult: { data?: unknown; isError: boolean } = {
  data: undefined,
  isError: false,
};

vi.mock("@sgia/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sgia/api-client")>()),
  useCreateIncidentReport: () => ({ mutateAsync, isPending: false }),
  useEquipmentUnitByCode: (code?: string) =>
    code ? unitResult : { data: undefined, isError: false },
  useLocations: () => ({
    data: {
      data: [
        { id: 3, nombre: "Laboratorio 3", tipo: "sala" },
        { id: 4, nombre: "Taller 1", tipo: "taller" },
        { id: 5, nombre: "Pañol Central", tipo: "panol" },
        { id: 6, nombre: "Bodega Norte", tipo: "bodega" },
      ],
    },
  }),
}));

// El lienzo no existe en happy-dom: se reemplaza por un botón que "firma".
vi.mock("./components/signature-pad", () => ({
  SignaturePad: ({ onChange }: { onChange: (v: string) => void }) => (
    <button
      type="button"
      onClick={() => onChange("data:image/png;base64,AAAA")}
    >
      Firmar
    </button>
  ),
}));

describe("NewIncidentDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unitResult = { data: undefined, isError: false };
    mutateAsync.mockResolvedValue({ id: 1, code: "NOV-0001" });
  });

  it("no envía y muestra los errores si faltan datos", async () => {
    const user = userEvent.setup();
    render(<NewIncidentDialog open onClose={vi.fn()} onCreated={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /enviar informe/i }));

    expect(
      await screen.findByText("Indica la asignatura o actividad."),
    ).toBeDefined();
    expect(screen.getByText("Selecciona el laboratorio o pañol.")).toBeDefined();
    expect(
      screen.getByText("Marca al menos un tipo de problema."),
    ).toBeDefined();
    expect(screen.getByText("Falta la firma.")).toBeDefined();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("ofrece salas, talleres y pañoles, pero no bodegas", () => {
    render(<NewIncidentDialog open onClose={vi.fn()} onCreated={vi.fn()} />);

    const options = screen
      .getAllByRole("option")
      .map((option) => option.textContent);

    expect(options).toEqual(
      expect.arrayContaining(["Laboratorio 3", "Taller 1", "Pañol Central"]),
    );
    expect(options).not.toContain("Bodega Norte");
  });

  it("exige describir el problema marcado", async () => {
    const user = userEvent.setup();
    render(<NewIncidentDialog open onClose={vi.fn()} onCreated={vi.fn()} />);
    await user.click(screen.getByLabelText(/falla de equipos/i));
    await user.click(screen.getByRole("button", { name: /enviar informe/i }));

    expect(
      await screen.findByText("Describe el problema marcado."),
    ).toBeDefined();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("envía el informe completo y avisa el código", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    const onClose = vi.fn();
    render(<NewIncidentDialog open onClose={onClose} onCreated={onCreated} />);

    await user.type(screen.getByLabelText("Asignatura"), "Redes");
    await user.selectOptions(screen.getByLabelText("Laboratorio o pañol"), "3");
    await user.click(screen.getByLabelText(/falla de equipos/i));
    await user.type(
      screen.getByLabelText(/Descripción: Falla de equipos/i),
      "No enciende",
    );
    await user.click(screen.getByRole("button", { name: "Firmar" }));
    await user.click(screen.getByRole("button", { name: /enviar informe/i }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Redes",
        location_id: 3,
        problems: [{ type: "falla_equipo", description: "No enciende" }],
        signature: "data:image/png;base64,AAAA",
      }),
    );
    expect(onCreated).toHaveBeenCalledWith("NOV-0001");
    expect(onClose).toHaveBeenCalled();
  });

  it("muestra el equipo al salir del campo de código", async () => {
    unitResult = {
      data: { code: "PRO-ISD-000001", product: { name: "Osciloscopio" } },
      isError: false,
    };
    const user = userEvent.setup();
    render(<NewIncidentDialog open onClose={vi.fn()} onCreated={vi.fn()} />);
    await user.type(
      screen.getByLabelText(/código del equipo/i),
      "PRO-ISD-000001",
    );
    await user.tab();
    expect(await screen.findByText(/Osciloscopio/)).toBeDefined();
  });

  it("si el código no es una unidad avisa que se enviará igual", async () => {
    unitResult = { data: undefined, isError: true };
    const user = userEvent.setup();
    render(<NewIncidentDialog open onClose={vi.fn()} onCreated={vi.fn()} />);
    await user.type(
      screen.getByLabelText(/código del equipo/i),
      "7801234567890",
    );
    await user.tab();
    expect(await screen.findByText(/se enviará igual/i)).toBeDefined();
  });
});
