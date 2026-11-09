import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import MisSolicitudesPage from "./pages/mis-solicitudes-page";

const cancelAsync = vi.fn();
const requestsSpy = vi.fn();

const baseLoan = {
  career: { id: 3, name: "Informática" },
  subject: "Redes",
  loan_date: "2026-11-12",
  start_time: "08:30",
  end_time: "10:00",
  storeroom: { id: 1, name: "Pañol Temuco" },
  location: { id: 12, nombre: "Laboratorio 3" },
  items: [
    {
      id: 1,
      productoId: 45,
      cantidad: 3,
      nombre: "Cable UTP",
      codigoBarras: "INS-1",
    },
  ],
};
const loans = [
  { ...baseLoan, id: 1, codigo: "REM-2026-AAA111", estado: "pendiente" },
  {
    ...baseLoan,
    id: 2,
    codigo: "REM-2026-BBB222",
    estado: "rechazado",
    motivoRechazo: "Sin stock suficiente",
  },
  { ...baseLoan, id: 3, codigo: "REM-2026-CCC333", estado: "procesado" },
];

vi.mock("@sgia/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sgia/api-client")>()),
  useMyLoanRequests: (params: unknown) => {
    requestsSpy(params);
    return { data: loans, isLoading: false, isError: false };
  },
  useCancelLoanRequest: () => ({ mutateAsync: cancelAsync, isPending: false }),
}));

describe("MisSolicitudesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cancelAsync.mockResolvedValue(undefined);
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <MisSolicitudesPage />
      </MemoryRouter>,
    );

  it("lista las solicitudes con carrera, horario, laboratorio y pañol", () => {
    renderPage();
    expect(screen.getByText("REM-2026-AAA111")).toBeDefined();
    expect(screen.getAllByText("Informática").length).toBe(3);
    expect(screen.getAllByText("08:30 - 10:00").length).toBe(3);
    expect(screen.getByText("Procesada")).toBeDefined();
    expect(screen.getByText("Rechazada")).toBeDefined();
    expect(screen.getAllByText("Laboratorio 3").length).toBe(3);
    expect(screen.getAllByText("Pañol Temuco").length).toBe(3);
  });

  it("solo las pendientes se pueden cancelar", () => {
    renderPage();
    expect(
      screen.getByRole("button", { name: "Cancelar REM-2026-AAA111" }),
    ).toBeDefined();
    expect(
      screen.queryByRole("button", { name: "Cancelar REM-2026-BBB222" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Cancelar REM-2026-CCC333" }),
    ).toBeNull();
  });

  it("cancelar pide confirmación y llama a la API", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      screen.getByRole("button", { name: "Cancelar REM-2026-AAA111" }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(/¿Cancelar la solicitud REM-2026-AAA111\?/),
    ).toBeDefined();
    await user.click(
      within(dialog).getByRole("button", { name: "Cancelar solicitud" }),
    );
    await waitFor(() => expect(cancelAsync).toHaveBeenCalledWith(1));
  });

  it("el detalle muestra los insumos y el motivo de rechazo", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("REM-2026-BBB222"));
    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByText("Cable UTP")).toBeDefined();
    expect(within(sheet).getByText(/Sin stock suficiente/)).toBeDefined();
    expect(
      within(sheet).queryByRole("button", { name: /cancelar solicitud/i }),
    ).toBeNull();
  });

  it("el filtro de estado consulta con ese estado", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Pendientes" }));
    expect(requestsSpy).toHaveBeenLastCalledWith({
      status: "pendiente",
      per_page: 50,
    });
  });
});
