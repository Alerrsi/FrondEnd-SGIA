import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { InvoiceScanResponse } from '@sgia/types';

import { FacturaUploadModal } from './components/factura-upload-modal';

const mockScanResponse: InvoiceScanResponse = {
  invoice_number: 'FAC-2026-9812',
  supplier_name: 'Electrónica y Redes Chile Ltda',
  supplier_id: 15,
  products: [
    {
      name: 'Tester Multímetro Digital Fluke 115',
      quantity: 3,
      price: 85000,
      barcode: 'SGIA-FLUKE-115',
    },
    {
      name: 'Cable Red UTP Cat6 305m Bobina',
      quantity: 5,
      price: 45000,
    },
  ],
};

const mockScanMutateAsync = vi.fn();
const mockCreateMutateAsync = vi.fn();

vi.mock('@sgia/api-client', () => ({
  useScanInvoice: () => ({
    mutateAsync: mockScanMutateAsync,
    isPending: false,
  }),
  useCreateProducto: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/lib/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('FacturaUploadModal (REQ-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload dropzone when opened without scan results', () => {
    render(<FacturaUploadModal open={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Alta de productos vía Factura \(OCR\)/i)).toBeDefined();
    expect(screen.getByText(/Arrastra aquí la factura o haz clic para seleccionarla/i)).toBeDefined();
    expect(screen.getByText(/PDF, JPG, PNG o WEBP/i)).toBeDefined();
  });

  it('uploads file, parses OCR drafts, and displays draft items table', async () => {
    mockScanMutateAsync.mockResolvedValueOnce(mockScanResponse);

    render(<FacturaUploadModal open={true} onClose={vi.fn()} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDefined();

    const file = new File(['dummy-content'], 'factura-compra.pdf', {
      type: 'application/pdf',
    });

    const user = userEvent.setup();
    await user.upload(fileInput, file);

    expect(mockScanMutateAsync).toHaveBeenCalledWith(file);

    // After resolution, invoice details and products should be rendered
    await waitFor(() => {
      expect(screen.getByText('FAC-2026-9812')).toBeDefined();
      expect(screen.getByText('Electrónica y Redes Chile Ltda')).toBeDefined();
    });

    // Check draft product rows
    expect(screen.getByDisplayValue('Tester Multímetro Digital Fluke 115')).toBeDefined();
    expect(screen.getByDisplayValue('Cable Red UTP Cat6 305m Bobina')).toBeDefined();
  });

  it('allows batch confirmation and creation of draft items', async () => {
    mockScanMutateAsync.mockResolvedValueOnce(mockScanResponse);
    mockCreateMutateAsync.mockResolvedValue({ id: 101, name: 'Ok' });

    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <FacturaUploadModal open={true} onClose={handleClose} onSuccess={handleSuccess} />,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy'], 'factura.png', { type: 'image/png' });

    const user = userEvent.setup();
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/Confirmar y dar de alta/i)).toBeDefined();
    });

    const confirmButton = screen.getByText(/Confirmar y dar de alta/i);
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockCreateMutateAsync).toHaveBeenCalledTimes(2);
      expect(handleSuccess).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
