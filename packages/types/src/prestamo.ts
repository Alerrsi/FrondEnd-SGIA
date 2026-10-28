export const LoanStatus = {
  EN_PROCESO: 'en_proceso',
  PROCESADA: 'procesada',
  RECHAZADA: 'rechazada',
  PENDIENTE: 'pendiente',
  PREPARADO: 'preparado',
  ENTREGADO: 'entregado',
  ACTIVO: 'activo',
  DEVUELTO: 'devuelto',
  ATRASADO: 'atrasado',
} as const;

export type LoanStatus = (typeof LoanStatus)[keyof typeof LoanStatus];

export type LoanOrigin = 'remoto' | 'presencial';

export interface ItemPrestamo {
  id?: number;
  prestamoId?: number;
  productoId?: number;
  product_id?: number;
  cantidad?: number;
  quantity?: number;
  nombre?: string;
  name?: string;
  productoNombre?: string;
  codigoBarras?: string;
  barcode?: string;
  stockActual?: number;
  current_stock?: number;
  sala?: string;
  cajon?: string;
  devuelto?: boolean;
}

export interface PrestamoEvento {
  id?: number | string;
  titulo?: string;
  evento?: string;
  fecha: string;
  usuario?: string | null;
  rol?: string | null;
  descripcion?: string | null;
  tipo?: 'solicitud' | 'aprobacion' | 'entrega' | 'devolucion' | 'rechazo' | 'incidente';
}

export interface Prestamo {
  id: number;
  codigo?: string;
  code?: string;
  solicitanteId?: number;
  solicitanteNombre?: string;
  solicitanteEmail?: string;
  solicitanteRun?: string;
  usuarioId?: number;
  usuario?: { name?: string; email?: string } | null;
  user_id?: number;
  tipo?: string;
  items: Array<{
    id?: number;
    prestamoId?: number;
    productoId: number;
    product_id?: number;
    cantidad: number;
    quantity?: number;
    nombre?: string;
    productoNombre?: string;
    codigoBarras?: string;
    stockActual?: number;
    sala?: string;
    cajon?: string;
    devuelto?: boolean;
  }>;
  origen: LoanOrigin | string;
  estado: LoanStatus | string;
  status?: LoanStatus | string;
  status_label?: string;
  asignatura?: string | null;
  subject?: string | null;
  carrera?: string | null;
  sala?: string | null;
  room?: string | null;
  bloqueHorario?: string | null;
  fechaPrestamo?: string | null;
  fechaSolicitud?: string | null;
  fechaSolicitada?: string | null;
  loan_date?: string | null;
  time_block?: string | null;
  fechaDevolucion?: string | null;
  return_date?: string | null;
  returned_at?: string | null;
  fechaEntrega?: string | null;
  motivoRechazo?: string | null;
  rejection_reason?: string | null;
  observaciones?: string | null;
  notes?: string | null;
  procesadoPorId?: number | null;
  procesadoPorNombre?: string | null;
  tramitadoAt?: string | null;
  processed_at?: string | null;
  diasAtraso?: number;
  allowed_transitions?: string[];
  eventos?: PrestamoEvento[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface CreatePrestamoPayload {
  items: Array<{ product_id?: number; productoId?: number; quantity?: number; cantidad?: number }>;
  origen?: LoanOrigin;
  asignatura?: string;
  subject?: string;
  sala?: string;
  room?: string;
  fechaSolicitada?: string;
  loan_date?: string;
  fecha?: string;
  time_block?: string;
  notes?: string;
}

export type RemoteLoanRequestPayload = CreatePrestamoPayload;

export interface AprobarPrestamoPayload {
  return_date?: string;
  fechaDevolucion?: string;
  notes?: string;
  observaciones?: string;
}

export interface RechazarPrestamoPayload {
  rejection_reason?: string;
  motivoRechazo?: string;
  motivo?: string;
}

export interface LoanCheckoutPayload {
  borrower_name?: string;
  solicitante?: string;
  borrower_document?: string;
  credencial?: string;
  docente_run?: string;
  credential_code?: string;
  subject?: string;
  asignatura?: string;
  room?: string;
  sala?: string;
  loan_date?: string;
  fecha?: string;
  time_block?: string;
  notes?: string;
  items: Array<{
    barcode?: string;
    product_id?: number;
    quantity: number;
  }>;
}

export interface LoanCheckinPayload {
  loan_id: number;
  general_notes?: string;
  items: Array<{
    product_id?: number;
    productoId?: number;
    item_id?: number;
    condition?: 'bueno' | 'regular' | 'dañado' | 'optimo' | 'extraviado';
    damaged?: boolean;
    dañado?: boolean;
    quantity_returned?: number;
    notes?: string;
    observaciones?: string;
  }>;
}

export interface LoanExportParams {
  start_date?: string;
  end_date?: string;
  from_date?: string;
  to_date?: string;
  status?: string;
  format: 'pdf' | 'excel' | 'xlsx';
}

export interface LoanParams {
  page?: number;
  per_page?: number;
  perPage?: number;
  search?: string;
  status?: LoanStatus | string;
  estado?: LoanStatus | string;
  tipo?: LoanOrigin | string;
  type?: LoanOrigin | string;
  origen?: LoanOrigin | string;
  insumo?: string;
  product?: string;
  profesor?: string;
  teacher?: string;
  borrower?: string;
  run?: string;
  docente?: string;
  asignatura?: string;
  subject?: string;
  sala?: string;
  room?: string;
  start_date?: string;
  end_date?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export type PrestamoParams = LoanParams;

export interface LoanRequestQueryParams {
  status?: string;
  estado?: string;
  per_page?: number;
  page?: number;
}
