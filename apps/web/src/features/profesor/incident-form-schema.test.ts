import { describe, expect, it } from "vitest";

import {
  incidentFormSchema,
  initialIncidentValues,
  toIncidentPayload,
  type IncidentFormValues,
} from "./lib/incident-form-schema";

function valid(): IncidentFormValues {
  const values = initialIncidentValues();
  values.subject = "Redes";
  values.location_id = 3;
  values.signature = "data:image/png;base64,AAAA";
  values.problems[0] = {
    type: "falla_equipo",
    checked: true,
    description: "No enciende",
  };
  return values;
}

const paths = (values: IncidentFormValues) => {
  const result = incidentFormSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
};

describe("incidentFormSchema", () => {
  it("acepta un informe completo", () => {
    expect(paths(valid())).toEqual([]);
  });

  it("exige asignatura, laboratorio y firma", () => {
    const values = {
      ...valid(),
      subject: " ",
      location_id: Number.NaN,
      signature: "",
    };
    expect(paths(values)).toEqual(
      expect.arrayContaining(["subject", "location_id", "signature"]),
    );
  });

  it("respeta los largos máximos del backend", () => {
    expect(paths({ ...valid(), subject: "x".repeat(101) })).toContain(
      "subject",
    );
    expect(paths({ ...valid(), suggestion: "x".repeat(2001) })).toContain(
      "suggestion",
    );
    const values = valid();
    values.problems[0] = {
      type: "falla_equipo",
      checked: true,
      description: "x".repeat(1001),
    };
    expect(paths(values)).toContain("problems.0.description");
  });

  it("rechaza una fecha futura", () => {
    expect(paths({ ...valid(), report_date: "2999-01-01" })).toContain(
      "report_date",
    );
  });

  it("exige marcar al menos un problema", () => {
    const values = valid();
    values.problems[0] = {
      type: "falla_equipo",
      checked: false,
      description: "",
    };
    expect(paths(values)).toContain("problems");
  });

  it("exige descripción en cada problema marcado", () => {
    const values = valid();
    values.problems[1] = {
      type: "falta_equipamiento",
      checked: true,
      description: "  ",
    };
    expect(paths(values)).toContain("problems.1.description");
  });

  it("valida tipo y tamaño de la foto", () => {
    const pdf = new File(["x"], "a.pdf", { type: "application/pdf" });
    expect(paths({ ...valid(), evidence_photo: pdf })).toContain(
      "evidence_photo",
    );
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "a.png", {
      type: "image/png",
    });
    expect(paths({ ...valid(), evidence_photo: big })).toContain(
      "evidence_photo",
    );
    const ok = new File(["x"], "a.png", { type: "image/png" });
    expect(paths({ ...valid(), evidence_photo: ok })).toEqual([]);
  });

  it("arma el payload solo con los problemas marcados", () => {
    const payload = toIncidentPayload(valid());
    expect(payload).toMatchObject({
      subject: "Redes",
      location_id: 3,
      problems: [{ type: "falla_equipo", description: "No enciende" }],
      signature: "data:image/png;base64,AAAA",
    });
    expect(payload.suggestion).toBeUndefined();
    expect(payload.equipment_code).toBeUndefined();
  });
});
