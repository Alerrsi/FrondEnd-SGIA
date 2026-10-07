import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fetchEquipmentReports,
  fetchEquipmentSpecs,
  fetchEquipmentTechnicalSheet,
  updateEquipmentSpecs,
  useEquipmentSpecs,
  useUpdateEquipmentSpecs,
} from '@sgia/api-client';
import type { EquipmentSpecs, UpdateEquipmentSpecsPayload } from '@sgia/types';
import { calculateEquipmentLifeCycle } from './utils/lifecycle';

describe('Unit Test: Hooks y Servicios de Fichas Técnicas de Equipos (REQ-12)', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('fetchEquipmentSpecs', () => {
    it('consulta /api/equipment/{id}/specs y retorna especificaciones técnicas', async () => {
      const mockSpecs: EquipmentSpecs = {
        equipment_id: 10,
        specifications: {
          CPU: 'Intel Xeon Gold 6248R',
          RAM: '128 GB DDR4 ECC',
          Potencia: '750W Redundante',
        },
        user_manual_url: 'https://s3.amazonaws.com/sgia/manual-server.pdf',
        purchase_date: '2023-01-10',
        lifespan_years: 5,
      };

      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: mockSpecs }),
      } as Response);

      const res = await fetchEquipmentSpecs(10);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/equipment/10/specs',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(res.equipment_id).toBe(10);
      expect(res.specifications.CPU).toBe('Intel Xeon Gold 6248R');
      expect(res.user_manual_url).toContain('manual-server.pdf');
    });
  });

  describe('updateEquipmentSpecs', () => {
    it('envía PUT /api/equipment/{id}/specs con el payload correspondiente', async () => {
      const payload: UpdateEquipmentSpecsPayload = {
        specifications: {
          'Puertos PoE': '48x Gigabit Ethernet',
          Potencia: '370W',
        },
        purchase_date: '2022-05-12',
        lifespan_years: 7,
        user_manual_url: 'https://s3.amazonaws.com/sgia/cisco-2960.pdf',
      };

      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id: 1,
            equipment_id: 15,
            ...payload,
          },
        }),
      } as Response);

      const res = await updateEquipmentSpecs(15, payload);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/equipment/15/specs',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(payload),
        }),
      );
      expect(res.equipment_id).toBe(15);
      expect(res.lifespan_years).toBe(7);
    });
  });

  describe('fetchEquipmentTechnicalSheet y fetchEquipmentReports (Blobs)', () => {
    it('descarga ficha técnica formal en PDF como Blob', async () => {
      const mockPdfBlob = new Blob(['%PDF-1.4 mock pdf data'], { type: 'application/pdf' });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        blob: async () => mockPdfBlob,
      } as Response);

      const blob = await fetchEquipmentTechnicalSheet(25);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
    });

    it('descarga reporte de mantenciones y hojas de vida como Blob', async () => {
      const mockReportBlob = new Blob(['%PDF-1.4 mock report'], { type: 'application/pdf' });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        blob: async () => mockReportBlob,
      } as Response);

      const blob = await fetchEquipmentReports(25);

      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe('useEquipmentSpecs hook', () => {
    it('ejecuta query y retorna las especificaciones del equipo', async () => {
      const mockSpecs: EquipmentSpecs = {
        equipment_id: 42,
        specifications: { AnchoBanda: '100 MHz', Canales: 4 },
        user_manual_url: 'https://s3.amazonaws.com/sgia/tektronix.pdf',
        purchase_date: '2024-03-01',
        lifespan_years: 6,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSpecs,
      } as Response);

      const { result } = renderHook(() => useEquipmentSpecs(42), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.equipment_id).toBe(42);
      expect(result.current.data?.specifications.Canales).toBe(4);
    });
  });

  describe('useUpdateEquipmentSpecs hook', () => {
    it('ejecuta mutación PUT e invalida claves de caché relevantes', async () => {
      const payload: UpdateEquipmentSpecsPayload = {
        specifications: { Firmware: 'IOS XE 16.12' },
        lifespan_years: 5,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          equipment_id: 8,
          specifications: payload.specifications,
        }),
      } as Response);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateEquipmentSpecs(), { wrapper });

      await result.current.mutateAsync({ id: 8, payload });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['equipment', 'specs', 8],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['equipment'],
      });
    });
  });

  describe('calculateEquipmentLifeCycle', () => {
    it('calcula correctamente el ciclo de vida para un equipo dentro de vida útil', () => {
      const fixedNow = new Date('2026-10-07T00:00:00Z');
      const purchaseDate = '2024-10-07'; // 2 años transcurridos
      const lifespanYears = 5;

      const result = calculateEquipmentLifeCycle(purchaseDate, lifespanYears, fixedNow);

      expect(result.lifespanYears).toBe(5);
      expect(result.ageYears).toBe(2);
      expect(result.remainingYears).toBe(3);
      expect(result.percentUsed).toBe(40);
      expect(result.isExpired).toBe(false);
      expect(result.isCritical).toBe(false);
      expect(result.statusTone).toBe('available');
    });

    it('identifica equipo próximo a reemplazo (< 1 año restante)', () => {
      const fixedNow = new Date('2026-10-07T00:00:00Z');
      const purchaseDate = '2022-04-07'; // 4.5 años transcurridos
      const lifespanYears = 5;

      const result = calculateEquipmentLifeCycle(purchaseDate, lifespanYears, fixedNow);

      expect(result.remainingYears).toBeLessThanOrEqual(1);
      expect(result.isCritical).toBe(true);
      expect(result.statusTone).toBe('critical');
    });

    it('identifica equipo con vida útil expirada', () => {
      const fixedNow = new Date('2026-10-07T00:00:00Z');
      const purchaseDate = '2019-01-01'; // Más de 7 años transcurridos
      const lifespanYears = 5;

      const result = calculateEquipmentLifeCycle(purchaseDate, lifespanYears, fixedNow);

      expect(result.remainingYears).toBe(0);
      expect(result.isExpired).toBe(true);
      expect(result.isCritical).toBe(true);
      expect(result.statusTone).toBe('critical');
    });

    it('maneja con seguridad equipos sin fecha de compra registrada', () => {
      const result = calculateEquipmentLifeCycle(null, 5);

      expect(result.purchaseDateFormatted).toBe('No registrada');
      expect(result.isExpired).toBe(false);
      expect(result.statusTone).toBe('neutral');
    });
  });
});
