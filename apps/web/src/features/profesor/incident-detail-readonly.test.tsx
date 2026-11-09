import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { IncidentDetailSheet } from "@/features/novedades/components/incident-detail-sheet";

vi.mock("@sgia/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sgia/api-client")>()),
  useIncidentReport: () => ({
    isLoading: false,
    data: {
      id: 1,
      code: "NV-2026-X1",
      status: "reportado",
      report_date: "2026-11-05",
      subject: "Redes",
      problems: [{ type: "falla_equipo", description: "No enciende" }],
      allowed_transitions: ["en_revision", "descartado"],
      created_at: "2026-11-05T10:00:00Z",
      updated_at: "2026-11-05T10:00:00Z",
    },
  }),
  useUpdateIncidentReportStatus: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

describe("IncidentDetailSheet", () => {
  it("el personal ve los botones de cambio de estado", () => {
    render(<IncidentDetailSheet reportId={1} onClose={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /pasar a revisión/i }),
    ).toBeDefined();
  });

  it("el profesor (solo lectura) no los ve y la fecha no se corre de día", () => {
    render(<IncidentDetailSheet reportId={1} onClose={vi.fn()} readOnly />);
    expect(
      screen.queryByRole("button", { name: /pasar a revisión/i }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: /descartar/i })).toBeNull();
    expect(screen.getByText("05-11-2026")).toBeDefined();
  });
});
