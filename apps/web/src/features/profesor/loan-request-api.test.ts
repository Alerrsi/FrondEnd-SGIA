import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLoanRequest,
  fetchLocations,
  fetchMyLoanRequests,
} from "@sgia/api-client";

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

const loan = {
  id: 9,
  code: "REM-2026-ABC123",
  status: "pendiente",
  career_id: 3,
  career: { id: 3, name: "Informática", code: "ISD" },
  storeroom_id: 1,
  storeroom: { id: 1, name: "Pañol Temuco", code: "PAN-TEMUCO" },
  location_id: 12,
  location: { id: 12, nombre: "Laboratorio 3", tipo: "sala" },
  start_time: "08:30:00",
  end_time: "10:00:00",
  time_block: "08:30 - 10:00",
  room: "Laboratorio 3",
  teacher: { id: 5, name: "Ana Docente" },
  items: [
    {
      id: 1,
      quantity: 3,
      product: { id: 45, name: "Cable UTP", barcode: "INS-1" },
    },
  ],
};

describe("Solicitud remota de préstamo: cliente API", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("cliente nuevo: envía carrera, horario, pañol y laboratorio sin room ni time_block", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ data: loan }, 201));

    const created = await createLoanRequest({
      items: [{ product_id: 45, quantity: 3 }],
      subject: "Redes",
      career_id: 3,
      loan_date: "2026-11-12",
      start_time: "08:30",
      end_time: "10:00",
      storeroom_id: 1,
      location_id: 12,
      notes: "Traer cables",
    });

    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/loans/requests");
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      career_id: 3,
      subject: "Redes",
      loan_date: "2026-11-12",
      start_time: "08:30",
      end_time: "10:00",
      storeroom_id: 1,
      location_id: 12,
      items: [{ product_id: 45, quantity: 3 }],
    });
    expect(body).not.toHaveProperty("room");
    expect(body).not.toHaveProperty("time_block");
    expect(created.start_time).toBe("08:30");
    expect(created.end_time).toBe("10:00");
    expect(created.location?.nombre).toBe("Laboratorio 3");
    expect(created.storeroom?.code).toBe("PAN-TEMUCO");
    expect(created.teacher?.name).toBe("Ana Docente");
  });

  it("cliente antiguo (móvil): sigue enviando room y time_block", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ data: loan }, 201));
    await createLoanRequest({
      items: [{ product_id: 45, quantity: 1 }],
      subject: "Redes",
      career_id: 3,
      room: "Lab 1",
      loan_date: "2026-11-12",
      time_block: "Bloque 1-2: 08:30 - 10:00",
    });
    const body = JSON.parse(
      String((spy.mock.calls[0] as [string, RequestInit])[1].body),
    );
    expect(body.room).toBe("Lab 1");
    expect(body.time_block).toBe("Bloque 1-2: 08:30 - 10:00");
    expect(body).not.toHaveProperty("start_time");
  });

  it("mis solicitudes: filtros de pañol, carrera y fecha, e ítems con producto", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ data: [loan] }));

    const list = await fetchMyLoanRequests({
      storeroom_id: 1,
      career_id: 3,
      loan_date: "2026-11-12",
    });

    const url = (spy.mock.calls[0] as [string])[0];
    expect(url).toContain("/loans/requests?");
    expect(url).toContain("storeroom_id=1");
    expect(url).toContain("career_id=3");
    expect(url).toContain("loan_date=2026-11-12");
    expect(list[0]?.items[0]).toMatchObject({
      product_id: 45,
      quantity: 3,
      nombre: "Cable UTP",
    });
  });

  it("laboratorios: filtra por pañol y tipo", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: 12, nombre: "Laboratorio 3", tipo: "sala" }],
        }),
      );
    await fetchLocations({ tipo: "sala", storeroom_id: 1 });
    const url = (spy.mock.calls[0] as [string])[0];
    expect(url).toContain("tipo=sala");
    expect(url).toContain("storeroom_id=1");
  });
});
