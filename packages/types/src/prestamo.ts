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
  productoId?: number;
  product_id?: number;
  cantidad?: number;
  quantity?: number;
}

export interface Prestamo {
  id: number;
  codigo?: string;
  solicitanteId: number;
  solicitanteNombre?: string;
  user_id?: number;
  items: Array<{ productoId: number; cantidad: number }>;
  origen: LoanOrigin;
  estado: LoanStatus;
  asignatura?: string | null;
  subject?: string | null;
  sala?: string | null;
  room?: string | null;
  fechaSolicitada?: string | null;
  loan_date?: string | null;
  time_block?: string | null;
  fechaDevolucion?: string | null;
  motivoRechazo?: string | null;
  rejection_reason?: string | null;
  procesadoPorId?: number | null;
  tramitadoAt?: string | null;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
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
  time_block?: string;
}

export interface RemoteLoanRequestPayload {
  items: Array<{ product_id: number; quantity: number }>;
  subject: string;
  room: string;
  loan_date: string;
  time_block: string;
}

export interface LoanCheckoutPayload {
  user_id?: number;
  credential_code?: string;
  items: Array<{ barcode: string; product_id?: number; quantity?: number }>;
  notes?: string;
}

export interface LoanCheckinPayload {
  items: Array<{ barcode: string; condition?: string; damaged?: boolean; notes?: string }>;
}

export interface AprobarPrestamoPayload {
  fechaDevolucion?: string;
  return_date?: string;
  notes?: string;
}

export interface RechazarPrestamoPayload {
  motivoRechazo?: string;
  rejection_reason?: string;
}

export interface PrestamoParams {
  estado?: LoanStatus | string;
  origen?: LoanOrigin;
  docente?: string;
  asignatura?: string;
  sala?: string;
  page?: number;
  perPage?: number;
  per_page?: number;
}
