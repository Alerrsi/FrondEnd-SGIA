import type { Student } from './estudiante';

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
  delivered_quantity?: number;
  returned_quantity?: number;
  units?: LoanItemUnit[];
}

export interface LoanItemUnit {
  id: number;
  code: string;
  serial_number?: string | null;
  status: string;
  returned_at?: string | null;
  return_condition?: 'bueno' | 'regular' | 'danado' | 'extraviado' | null;
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
  /** Estudiante ligado al préstamo presencial (REQ-20). */
  student_id?: number | null;
  student?: Student | null;
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
    delivered_quantity?: number;
    returned_quantity?: number;
    units?: LoanItemUnit[];
  }>;
  origen: LoanOrigin | string;
  estado: LoanStatus | string;
  status?: LoanStatus | string;
  status_label?: string;
  asignatura?: string | null;
  subject?: string | null;
  carrera?: string | null;
  career_id?: number | null;
  career?: {
    id: number;
    name: string;
    code?: string | null;
    level?: string | null;
  } | null;
  sala?: string | null;
  room?: string | null;
  bloqueHorario?: string | null;
  fechaPrestamo?: string | null;
  fechaSolicitud?: string | null;
  fechaSolicitada?: string | null;
  loan_date?: string | null;
  due_date?: string | null;
  time_block?: string | null;
  /** `HH:MM`; `null` en préstamos anteriores a la solicitud con horario. */
  start_time?: string | null;
  end_time?: string | null;
  storeroom_id?: number | null;
  storeroom?: { id: number; name: string; code?: string | null } | null;
  location_id?: number | null;
  /** Laboratorio (sala o taller) donde se usa el material. */
  location?: { id: number; nombre: string; tipo?: string | null } | null;
  /** Profesor que hizo la solicitud (el usuario autenticado). */
  teacher?: { id: number; name: string } | null;
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
  items: Array<{
    product_id?: number;
    productoId?: number;
    quantity?: number;
    cantidad?: number;
  }>;
  origen?: LoanOrigin;
  asignatura?: string;
  subject?: string;
  /** Obligatorio al solicitar un préstamo. */
  career_id: number;
  sala?: string;
  room?: string;
  fechaSolicitada?: string;
  loan_date?: string;
  fecha?: string;
  /** Solicitud con horario (`HH:MM`); el término debe ser posterior al inicio. */
  start_time?: string;
  end_time?: string;
  /** Pañol que prepara la solicitud. */
  storeroom_id?: number;
  /** Laboratorio (`sala` o `taller` de ese pañol). Reemplaza al texto libre `room`. */
  location_id?: number;
  /** Solo clientes antiguos: con `start_time`/`end_time` el backend lo regenera. */
  time_block?: string;
  /** Vencimiento opcional (`AAAA-MM-DD`), no anterior a `loan_date`; por defecto, la misma fecha. */
  due_date?: string;
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
  /**
   * Obligatorio solo cuando no se envía `student_id` ni `student_rut`; con RUT nuevo es el nombre
   * con el que el backend crea al estudiante.
   */
  borrower_name?: string;
  /** Estudiante existente (`GET /api/students/by-rut/{rut}` → 200). Excluyente con `student_rut`. */
  student_id?: number;
  /** RUT sin estudiante registrado: el backend lo crea. Excluyente con `student_id`. */
  student_rut?: string;
  due_date?: string;
  solicitante?: string;
  borrower_document?: string;
  credencial?: string;
  docente_run?: string;
  credential_code?: string;
  /** Obligatorio en el préstamo presencial. */
  career_id: number;
  subject?: string;
  asignatura?: string;
  room?: string;
  sala?: string;
  loan_date?: string;
  fecha?: string;
  time_block?: string;
  notes?: string;
  storeroom_id?: string;
  items: Array<{
    barcode?: string;
    product_id?: number;
    quantity: number;
    unit_ids?: number[];
  }>;
}

export interface LoanCheckinPayload {
  loan_id: number;
  general_notes?: string;
  items: Array<{
    product_id?: number;
    productoId?: number;
    item_id?: number;
    condition?: 'bueno' | 'regular' | 'dañado' | 'danado' | 'optimo' | 'extraviado';
    unit_ids?: number[];
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
  career_id?: number;
  storeroom_id?: number;
  location_id?: number;
  /** Fecha de la actividad (`AAAA-MM-DD`). */
  loan_date?: string;
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
  career_id?: number;
  /** Pañol que prepara el préstamo. */
  storeroom_id?: number;
  /** Laboratorio (sala o taller). */
  location_id?: number;
  /** Fecha de la actividad (`AAAA-MM-DD`). */
  loan_date?: string;
  sala?: string;
  room?: string;
  start_date?: string;
  end_date?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export type PrestamoParams = LoanParams;

/** Cola del pañol (`GET /api/loans/pending`). `storeroom_id` solo lo aplica el backend para `AD-01`. */
export interface PendingLoanParams {
  storeroom_id?: number;
  per_page?: number;
  page?: number;
}

export interface LoanRequestQueryParams {
  status?: string;
  estado?: string;
  storeroom_id?: number;
  career_id?: number;
  /** `AAAA-MM-DD`. */
  loan_date?: string;
  per_page?: number;
  page?: number;
}

export interface DeliverLoanPayload {
  items?: Array<{ item_id: number; unit_ids: number[] }>;
}
