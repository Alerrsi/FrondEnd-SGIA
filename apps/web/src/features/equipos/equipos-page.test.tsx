import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { Equipo } from '@sgia/types';

import EquiposPage from './pages/equipos-page';
import * as downloadModule from './utils/download';

const mockEquiposList: Equipo[] = [
  {
    id: 1,
    codigo: 'EQ-CISCO-01',
    sku: 'CISCO-CAT-2960X',
    nombre: 'Switch Cisco Catalyst 2960-X',
    marca: 'Cisco Systems',
    modelo: 'WS-C2960X-48FPS-L',
    categoria: 'Networking',
    ubicacion: 'Rack R-01 · U12',
    estado: 'operativo',
    purchase_date: '2023-03-15',
    lifespan_years: 5,
    user_manual_url: 'https://s3.amazonaws.com/sgia-manuals/cisco-2960x.pdf',
    specs: {
      equipment_id: 1,
      specifications: {
        Puertos: '48x Gigabit PoE+',
        Potencia: '370W',
        Stacking: 'FlexStack-Plus hasta 8 switches',
        'Throughput de Reenvío': '108 Gbps',
      },
      purchase_date: '2023-03-15',
      lifespan_years: 5,
      user_manual_url: 'https://s3.amazonaws.com/sgia-manuals/cisco-2960x.pdf',
    },
    maintenances: [
      {
        id: 101,
        equipment_id: 1,
        date: '2025-06-10',
        type: 'preventiva',
        technician: 'Ing. Rodrigo Vega',
        description: 'Actualización de firmware IOS y limpieza de ventiladores',
      },
    ],
    createdAt: '2023-03-15T10:00:00Z',
    updatedAt: '2025-06-10T14:00:00Z',
  },
  {
    id: 2,
    codigo: 'EQ-TEK-02',
    sku: 'TEK-TBS-1052B',
    nombre: 'Osciloscopio Digital Tektronix',
    marca: 'Tektronix',
    modelo: 'TBS1052B-EDU',
    categoria: 'Instrumentación',
    ubicacion: 'Laboratorio L2 · Estante 3',
    estado: 'en_mantencion',
    purchase_date: '2020-01-10',
    lifespan_years: 5, // Expirado (> 5 años al 2026)
    user_manual_url: null,
    specs: {
      equipment_id: 2,
      specifications: {
        'Ancho de Banda': '50 MHz',
        Canales: 2,
        Muestreo: '1 GS/s',
      },
      purchase_date: '2020-01-10',
      lifespan_years: 5,
    },
    createdAt: '2020-01-10T08:00:00Z',
    updatedAt: '2026-02-15T09:00:00Z',
  },
];

const mockMutateDownloadSheet = vi.fn();
const mockMutateDownloadReports = vi.fn();
const mockMutateUpdateSpecs = vi.fn();
const mockRefetch = vi.fn();

vi.mock('@sgia/api-client', () => ({
  useEquipos: () => ({
    data: mockEquiposList,
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
  }),
  useDownloadTechnicalSheet: () => ({
    mutateAsync: mockMutateDownloadSheet,
    isPending: false,
  }),
  useDownloadEquipmentReports: () => ({
    mutateAsync: mockMutateDownloadReports,
    isPending: false,
  }),
  useUpdateEquipmentSpecs: () => ({
    mutateAsync: mockMutateUpdateSpecs,
    isPending: false,
  }),
}));

// Mock de autenticación como DIR-01 (con permisos de edición)
vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 5,
      nombre: 'Director de Carrera',
      email: 'director@inacap.cl',
      rol: 'DIR-01',
    },
    logout: vi.fn(),
  }),
}));

vi.mock('@/lib/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Integration Test: Módulo de Fichas Técnicas de Equipos (/equipos)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el catálogo de equipos, cinta métrica de flota y datos en tabla TanStack', async () => {
    render(
      <MemoryRouter initialEntries={['/equipos']}>
        <EquiposPage />
      </MemoryRouter>,
    );

    // Título y badges
    expect(screen.getByText('Fichas Técnicas de Equipos')).toBeDefined();
    expect(screen.getByText('FU-05 · REQ-12')).toBeDefined();

    // Cinta métrica compacta
    expect(screen.getByText('Total Equipos')).toBeDefined();
    expect(screen.getByText('En Operación')).toBeDefined();
    expect(screen.getByText('En Mantención / Taller')).toBeDefined();
    expect(screen.getByText('Obsolescencia Próxima')).toBeDefined();

    // Filas de la tabla
    expect(screen.getByText('EQ-CISCO-01')).toBeDefined();
    expect(screen.getByText('Switch Cisco Catalyst 2960-X')).toBeDefined();
    expect(screen.getByText('EQ-TEK-02')).toBeDefined();
    expect(screen.getByText('Osciloscopio Digital Tektronix')).toBeDefined();
  });

  it('filtra los equipos en tiempo real según el término de búsqueda', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/equipos']}>
        <EquiposPage />
      </MemoryRouter>,
    );

    const searchInput = screen.getByLabelText('Buscar equipos');
    await user.type(searchInput, 'Tektronix');

    // Debe mostrar solo el osciloscopio
    expect(screen.getByText('Osciloscopio Digital Tektronix')).toBeDefined();
    expect(screen.queryByText('Switch Cisco Catalyst 2960-X')).toBeNull();
  });

  it('abre el drawer lateral (Sheet) para inspeccionar especificaciones, ciclo de vida y manual S3', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/equipos']}>
        <EquiposPage />
      </MemoryRouter>,
    );

    const verFichaButtons = screen.getAllByRole('button', { name: /ver ficha/i });
    await user.click(verFichaButtons[0]!); // Click en Switch Cisco

    // Drawer visible
    await waitFor(() => {
      expect(screen.getByText('Ciclo de Vida y Vida Útil Estimada')).toBeDefined();
    });

    expect(screen.getByText('Manual Oficial de Usuario (S3 / Cloud)')).toBeDefined();
    expect(screen.getByText(/cisco-2960x\.pdf/)).toBeDefined();

    // Especificaciones del hardware
    expect(screen.getByText('Puertos')).toBeDefined();
    expect(screen.getByText('48x Gigabit PoE+')).toBeDefined();
    expect(screen.getByText('FlexStack-Plus hasta 8 switches')).toBeDefined();

    // Historial de mantenciones
    expect(screen.getByText(/Actualización de firmware IOS/)).toBeDefined();
  });

  it('descarga ficha técnica institucional en PDF como blob con nombre de archivo dinámico', async () => {
    const user = userEvent.setup();
    const downloadBlobSpy = vi.spyOn(downloadModule, 'downloadBlob').mockImplementation(() => {});

    const mockPdfBlob = new Blob(['%PDF-1.4 sample content'], { type: 'application/pdf' });
    mockMutateDownloadSheet.mockResolvedValueOnce(mockPdfBlob);

    render(
      <MemoryRouter initialEntries={['/equipos']}>
        <EquiposPage />
      </MemoryRouter>,
    );

    // Abrir ficha técnica del Switch Cisco
    const verFichaButtons = screen.getAllByRole('button', { name: /ver ficha/i });
    await user.click(verFichaButtons[0]!);

    // Clic en "Ficha Técnica (PDF)"
    const downloadSheetBtn = await screen.findByRole('button', { name: /descargar ficha técnica pdf/i });
    await user.click(downloadSheetBtn);

    await waitFor(() => {
      expect(mockMutateDownloadSheet).toHaveBeenCalledWith(1);
    });

    expect(downloadBlobSpy).toHaveBeenCalledWith(
      mockPdfBlob,
      'ficha-tecnica-EQ-CISCO-01.pdf',
    );
  });

  it('descarga hoja de vida y reporte de mantenciones en PDF como blob con nombre de archivo dinámico', async () => {
    const user = userEvent.setup();
    const downloadBlobSpy = vi.spyOn(downloadModule, 'downloadBlob').mockImplementation(() => {});

    const mockReportBlob = new Blob(['%PDF-1.4 maintenance log'], { type: 'application/pdf' });
    mockMutateDownloadReports.mockResolvedValueOnce(mockReportBlob);

    render(
      <MemoryRouter initialEntries={['/equipos']}>
        <EquiposPage />
      </MemoryRouter>,
    );

    // Abrir ficha técnica del Switch Cisco
    const verFichaButtons = screen.getAllByRole('button', { name: /ver ficha/i });
    await user.click(verFichaButtons[0]!);

    // Clic en "Hoja de Vida (PDF)"
    const downloadReportsBtn = await screen.findByRole('button', { name: /descargar hoja de vida mantenciones pdf/i });
    await user.click(downloadReportsBtn);

    await waitFor(() => {
      expect(mockMutateDownloadReports).toHaveBeenCalledWith(1);
    });

    expect(downloadBlobSpy).toHaveBeenCalledWith(
      mockReportBlob,
      'hoja-vida-mantenciones-EQ-CISCO-01.pdf',
    );
  });

  it('permite a un usuario con rol DIR-01 editar especificaciones técnicas dinámicas y guardar vía PUT', async () => {
    const user = userEvent.setup();
    mockMutateUpdateSpecs.mockResolvedValueOnce({
      id: 1,
      equipment_id: 1,
      specifications: {},
    });

    render(
      <MemoryRouter initialEntries={['/equipos']}>
        <EquiposPage />
      </MemoryRouter>,
    );

    // Abrir ficha técnica del Switch Cisco
    const verFichaButtons = screen.getAllByRole('button', { name: /ver ficha/i });
    await user.click(verFichaButtons[0]!);

    // Clic en el botón "Editar" del drawer
    const editBtn = await screen.findByRole('button', { name: /editar especificaciones/i });
    await user.click(editBtn);

    // Modal de edición visible
    await waitFor(() => {
      expect(screen.getByText('Editar Ficha Técnica y Especificaciones')).toBeDefined();
    });

    // Modificar vida útil proyectada
    const lifespanInput = screen.getByLabelText(/vida útil proyectada/i);
    await user.clear(lifespanInput);
    await user.type(lifespanInput, '8');

    // Agregar un nuevo parámetro dinámico
    const addParamBtn = screen.getByRole('button', { name: /agregar parámetro/i });
    await user.click(addParamBtn);

    // Guardar
    const saveBtn = screen.getByRole('button', { name: /guardar ficha técnica/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockMutateUpdateSpecs).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          payload: expect.objectContaining({
            lifespan_years: 8,
          }),
        }),
      );
    });
  });
});
