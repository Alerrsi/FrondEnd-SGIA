import { describe, expect, it } from 'vitest';

import { REPORTS, findReport, reportScope, reportsForRole } from './catalog';
import { formatReportCell, groupThousands } from './lib/format-cell';
import { defaultPeriod, formatPeriodRange, periodRange, type PeriodValue } from './lib/period';
import { buildReportRequest, defaultFilterValues } from './lib/report-params';

const TODAY = new Date(2026, 10, 25, 12, 0); // 25-11-2026, segundo semestre

function period(partial: Partial<PeriodValue>): PeriodValue {
  return { ...defaultPeriod(TODAY), ...partial };
}

describe('catálogo de reportes por rol (docs/centro-reportes.md, decisiones 1 y 3)', () => {
  it('PAN-01 ve operación y el informe del período, nunca compras ni administración', () => {
    const pan = reportsForRole('PAN-01');
    expect(pan.some((r) => r.group === 'Compras')).toBe(false);
    expect(pan.some((r) => r.group === 'Administración')).toBe(false);
    expect(pan.map((r) => r.id)).toEqual(
      expect.arrayContaining(['inventario', 'prestamos', 'estudiantes', 'ubicaciones', 'informe-periodo']),
    );
  });

  it('AD-01 ve solo administración y ubicaciones', () => {
    const ad = reportsForRole('AD-01');
    expect(ad.map((r) => r.id).sort()).toEqual(['auditoria', 'monitoreo', 'ubicaciones', 'usuarios']);
    expect(ad.every((r) => r.group === 'Administración' || r.id === 'ubicaciones')).toBe(true);
  });

  it('DIR-01 ve compras y operación pero no estudiantes (solo PAN-01) ni administración; PRO-01 nada', () => {
    const dir = reportsForRole('DIR-01').map((r) => r.id);
    expect(dir).toEqual(expect.arrayContaining(['solicitudes', 'ordenes', 'facturas', 'presupuestos', 'proveedores', 'prestamos']));
    expect(dir).not.toContain('estudiantes');
    expect(dir).not.toContain('auditoria');
    expect(reportsForRole('PRO-01')).toEqual([]);
    expect(reportsForRole(undefined)).toEqual([]);
  });

  it('cada reporte tiene id único, ruta de export y hojas; el préstamo pide el Excel y el informe del período exige fechas', () => {
    expect(new Set(REPORTS.map((r) => r.id)).size).toBe(REPORTS.length);
    expect(findReport('prestamos')?.path).toBe('/loans/export?format=excel');
    const informe = findReport('informe-periodo');
    expect(informe?.path).toBe('/reports/period');
    expect(informe?.roles).toEqual(['DIR-01', 'PAN-01']);
    expect(informe?.filters.find((f) => f.type === 'period')).toMatchObject({ required: true });
    for (const r of REPORTS) {
      expect(r.sheets.length).toBeGreaterThan(0);
      expect(r.kind === 'period' || r.kind === 'snapshot').toBe(true);
    }
  });

  it('rankings con período obligatorio y Top 10 por defecto: proveedores solo DIR-01, profesores DIR-01 y PAN-01', () => {
    const suppliers = findReport('proveedores-mas-compras')!;
    const teachers = findReport('profesores-mas-prestamos')!;
    expect(suppliers).toMatchObject({ group: 'Rankings', path: '/reports/top-suppliers', roles: ['DIR-01'] });
    expect(teachers).toMatchObject({ group: 'Rankings', path: '/reports/top-teachers', roles: ['DIR-01', 'PAN-01'] });
    expect(reportsForRole('PAN-01').map((r) => r.id)).toContain('profesores-mas-prestamos');
    expect(reportsForRole('PAN-01').map((r) => r.id)).not.toContain('proveedores-mas-compras');
    expect(reportsForRole('AD-01').some((r) => r.group === 'Rankings')).toBe(false);

    const values = defaultFilterValues(teachers, TODAY);
    expect(values).toEqual({ top: '10' });
    expect(buildReportRequest(teachers, { ...values, tipo: 'remoto' }, period({ semester: 1 }), TODAY).params).toEqual({
      from: '2026-01-01',
      to: '2026-06-30',
      top: '10',
      tipo: 'remoto',
    });
    expect(buildReportRequest(suppliers, { top: '' }, period({ mode: 'range', from: '', to: '' }), TODAY).blocked).toMatch(
      /necesita un período/,
    );
    expect(reportScope(teachers, 'PAN-01')).toMatch(/tu pañol/);
  });

  it('el alcance de PAN-01 en préstamos dice que se limita a su pañol', () => {
    expect(reportScope(findReport('prestamos')!, 'PAN-01')).toMatch(/tu pañol/);
    expect(reportScope(findReport('prestamos')!, 'DIR-01')).toBe('Todo lo visible para tu rol.');
  });
});

describe('selector de período (decisión 7)', () => {
  it('por defecto el semestre en curso; semestre 1 = ene–jun y 2 = jul–dic', () => {
    expect(defaultPeriod(TODAY)).toMatchObject({ mode: 'semester', year: 2026, semester: 2 });
    expect(defaultPeriod(new Date(2026, 5, 30))).toMatchObject({ semester: 1 });
    expect(periodRange(period({ semester: 1 }), TODAY)).toEqual({ from: '2026-01-01', to: '2026-06-30' });
    expect(periodRange(period({ semester: 2 }), TODAY)).toEqual({ from: '2026-07-01', to: '2026-12-31' });
    expect(formatPeriodRange({ from: '2026-01-01', to: '2026-06-30' })).toBe('01-01-2026 a 30-06-2026');
  });

  it('año, mes (con bisiesto), últimos 30 días y rango', () => {
    expect(periodRange(period({ mode: 'year', year: 2025 }), TODAY)).toEqual({ from: '2025-01-01', to: '2025-12-31' });
    expect(periodRange(period({ mode: 'month', year: 2028, month: 2 }), TODAY)).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(periodRange(period({ mode: 'month', year: 2026, month: 11 }), TODAY)).toEqual({ from: '2026-11-01', to: '2026-11-30' });
    expect(periodRange(period({ mode: 'last30' }), TODAY)).toEqual({ from: '2026-10-27', to: '2026-11-25' });
    expect(periodRange(period({ mode: 'range', from: '2026-03-01', to: '2026-03-15' }), TODAY)).toEqual({
      from: '2026-03-01',
      to: '2026-03-15',
    });
    expect(periodRange(period({ mode: 'range', from: '2026-03-15', to: '2026-03-01' }), TODAY)).toBeNull();
    expect(periodRange(period({ mode: 'range', from: '', to: '2026-03-01' }), TODAY)).toBeNull();
  });

  it('usa la fecha local, no la de UTC, pasadas las 21:00', () => {
    const late = new Date(2026, 10, 25, 23, 30);
    expect(periodRange(period({ mode: 'last30' }), late)?.to).toBe('2026-11-25');
  });
});

describe('parámetros del reporte (lo que se ve es lo que se descarga)', () => {
  const prestamos = findReport('prestamos')!;

  it('envía from/to del período y traduce el estado de préstamos a los parámetros del backend', () => {
    const { params, blocked } = buildReportRequest(
      prestamos,
      { estado: 'activo', career_id: '3', search: '  REM ', storeroom_id: '' },
      period({ semester: 1 }),
      TODAY,
    );
    expect(blocked).toBeNull();
    expect(params).toEqual({
      from: '2026-01-01',
      to: '2026-06-30',
      status: 'procesado',
      devuelto: '0',
      career_id: 3,
      search: 'REM',
    });
  });

  it('el informe del período sin rango válido queda bloqueado; presupuestos parte en el año actual', () => {
    const informe = buildReportRequest(findReport('informe-periodo')!, {}, period({ mode: 'range', from: '', to: '' }), TODAY);
    expect(informe.blocked).toMatch(/necesita un período/);
    expect(informe.params).toEqual({});

    const presupuestos = findReport('presupuestos')!;
    const values = defaultFilterValues(presupuestos, TODAY);
    expect(values).toEqual({ year: '2026' });
    expect(buildReportRequest(presupuestos, values, period({}), TODAY).params).toEqual({ year: 2026 });
  });

  it('un reporte «foto» no envía fechas', () => {
    const { params } = buildReportRequest(findReport('inventario')!, { estado: 'sin_stock' }, period({}), TODAY);
    expect(params).toEqual({ estado: 'sin_stock' });
  });
});

describe('formato de celdas como en Excel', () => {
  it('fecha, fecha-hora en hora de Chile, monto, entero, año y sí/no', () => {
    expect(formatReportCell('2026-03-10', 'date')).toBe('10-03-2026');
    expect(formatReportCell('2026-03-10T14:30:00-03:00', 'datetime')).toBe('10-03-2026 14:30');
    // 02:15 UTC del 11 de marzo son las 23:15 del 10 en Chile (UTC-3 en horario de verano).
    expect(formatReportCell('2026-03-11T02:15:00Z', 'datetime')).toBe('10-03-2026 23:15');
    expect(formatReportCell(1990000, 'money')).toBe('$ 1.990.000');
    expect(formatReportCell('150000.00', 'money')).toBe('$ 150.000');
    expect(formatReportCell(-2500, 'money')).toBe('-$ 2.500');
    expect(formatReportCell(1234, 'integer')).toBe('1.234');
    expect(formatReportCell(2026, 'year')).toBe('2026');
    expect(formatReportCell(true, 'text')).toBe('sí');
    expect(formatReportCell(null, 'money')).toBe('');
    expect(groupThousands(165)).toBe('165');
  });
});
