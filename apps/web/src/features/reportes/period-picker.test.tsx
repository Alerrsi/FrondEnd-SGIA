import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { PeriodPicker } from './components/period-picker';
import { defaultPeriod, periodRange, type PeriodRange, type PeriodValue } from './lib/period';

const TODAY = new Date(2026, 10, 25, 12, 0);

function Harness({ onRange }: { onRange: (range: PeriodRange | null) => void }) {
  const [value, setValue] = useState<PeriodValue>(() => defaultPeriod(TODAY));
  return (
    <PeriodPicker
      value={value}
      today={TODAY}
      onChange={(next) => {
        setValue(next);
        onRange(periodRange(next, TODAY));
      }}
    />
  );
}

const shown = () => screen.getByTestId('period-range').textContent;

describe('PeriodPicker (docs/centro-reportes.md, decisión 7)', () => {
  it('parte en el semestre en curso y muestra sus fechas exactas', async () => {
    const onRange = vi.fn();
    render(<Harness onRange={onRange} />);
    expect((screen.getByLabelText('Tipo de período') as HTMLSelectElement).value).toBe('semester');
    expect(shown()).toBe('01-07-2026 a 31-12-2026');

    await userEvent.selectOptions(screen.getByLabelText('Semestre'), '1');
    expect(shown()).toBe('01-01-2026 a 30-06-2026');
    expect(onRange).toHaveBeenLastCalledWith({ from: '2026-01-01', to: '2026-06-30' });
  });

  it('año y mes devuelven from/to en YYYY-MM-DD', async () => {
    const user = userEvent.setup();
    const onRange = vi.fn();
    render(<Harness onRange={onRange} />);

    await user.selectOptions(screen.getByLabelText('Tipo de período'), 'year');
    await user.selectOptions(screen.getByLabelText('Año'), '2025');
    expect(shown()).toBe('01-01-2025 a 31-12-2025');
    expect(onRange).toHaveBeenLastCalledWith({ from: '2025-01-01', to: '2025-12-31' });

    await user.selectOptions(screen.getByLabelText('Tipo de período'), 'month');
    await user.selectOptions(screen.getByLabelText('Mes'), 'Febrero');
    expect(shown()).toBe('01-02-2025 a 28-02-2025');
    expect(onRange).toHaveBeenLastCalledWith({ from: '2025-02-01', to: '2025-02-28' });
  });

  it('rango parte de las fechas visibles y «últimos 30 días» termina hoy', async () => {
    const user = userEvent.setup();
    const onRange = vi.fn();
    render(<Harness onRange={onRange} />);

    await user.selectOptions(screen.getByLabelText('Tipo de período'), 'range');
    expect((screen.getByLabelText('Desde') as HTMLInputElement).value).toBe('2026-07-01');
    expect((screen.getByLabelText('Hasta') as HTMLInputElement).value).toBe('2026-12-31');

    await user.selectOptions(screen.getByLabelText('Tipo de período'), 'last30');
    expect(shown()).toBe('27-10-2026 a 25-11-2026');
  });
});
