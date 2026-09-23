export interface Equipo {
  id: number;
  nombre: string;
  codigo?: string;
  fichasTecnicas: FichaTecnica[];
  novedades: Novedad[];
  createdAt: string;
  updatedAt: string;
}

export interface FichaTecnica {
  id: number;
  equipoId: number;
  nombre: string;
  urlPdf: string;
  createdAt: string;
}

export interface Novedad {
  id: number;
  equipoId?: number | null;
  productoId?: number | null;
  reportadoPorId: number;
  tipo: 'falla' | 'reposicion';
  descripcion: string;
  adjuntoUrl?: string | null;
  resuelto: boolean;
  createdAt: string;
}

export interface CreateNovedadPayload {
  equipoId?: number;
  productoId?: number;
  tipo: 'falla' | 'reposicion';
  descripcion: string;
  adjunto?: File | null;
}