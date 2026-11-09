import { afterEach, describe, expect, it, vi } from "vitest";

import { formatDateOnly } from "@/features/compras/lib/format";
import { todayIso } from "./lib/dates";

describe("fechas sin hora", () => {
  afterEach(() => vi.useRealTimers());

  it("todayIso usa el día local aunque en UTC ya sea el siguiente", () => {
    vi.useFakeTimers();
    // 23:30 del 5 de noviembre hora local (en Chile ya es 6 de noviembre en UTC).
    vi.setSystemTime(new Date(2026, 10, 5, 23, 30));
    expect(todayIso()).toBe("2026-11-05");
  });

  it("formatDateOnly no corre el día por la zona horaria", () => {
    expect(formatDateOnly("2026-11-12")).toBe("12-11-2026");
    expect(formatDateOnly("2026-01-01")).toBe("01-01-2026");
    expect(formatDateOnly(null)).toBe("—");
  });
});
