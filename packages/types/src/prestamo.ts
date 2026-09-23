export const LoanStatus = {
  EN_PROCESO: 'en_proceso',
  PROCESADA: 'procesada',
  RECHAZADA: 'rechazada',
} as const;

export type LoanStatus = (typeof LoanStatus)[keyof typeof LoanStatus];

export type LoanOrigin = 'remoto' | 'presencial';

export interface ItemPrestamo {
  productoId: number;
  cantidad: number;
}

export interface Prestamo {
  id: number;
  codigo?: string;
  solicitanteId: number;
  solicitanteNombre?: string;
  items: ItemPrestamo[];
  origen: LoanOrigin;
  estado: LoanStatus;
  asignatura?: string | null;
  sala?: string | null;
  fechaSolicitada?: string | null;
  fechaDevolucion?: string | null;
  motivoRechazo?: string | null;
  procesadoPorId?: number | null;
  tramitadoAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrestamoPayload {
  items: ItemPrestamo[];
  origen: LoanOrigin;
  asignatura?: string;
  sala?: string;
  fechaSolicitada?: string;
}

export interface AprobarPrestamoPayload {
  fechaDevolucion?: string;
}

export interface RechazarPrestamoPayload {
  motivoRechazo: string;
}

export interface PrestamoParams {
  estado?: LoanStatus;
  origen?: LoanOrigin;
  page?: number;
  perPage?: number;
}