export interface Ubicacion {
  id: number;
  sala: string;
  cajon: string;
  descripcion?: string | null;
}

export interface Producto {
  id: number;
  nombre: string;
  codigoBarras: string;
  categoria: string;
  marca?: string | null;
  modelo?: string | null;
  stock: number;
  stockCritico: number;
  ubicacion: Ubicacion;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductoPayload {
  nombre: string;
  codigoBarras: string;
  categoria: string;
  marca?: string;
  modelo?: string;
  stock: number;
  stockCritico: number;
  ubicacionId: number;
}

export interface ExtraerFacturaPayload {
  archivo: File;
}

export interface BorradorProducto {
  nombre?: string;
  codigoBarras?: string;
  categoria?: string;
  marca?: string;
  modelo?: string;
  stock?: number;
}

export interface ProductoParams {
  query?: string;
  ubicacionId?: number;
  soloStockCritico?: boolean;
  page?: number;
  perPage?: number;
}