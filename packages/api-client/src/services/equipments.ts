import type { CreateNovedadPayload, Equipo, Novedad } from '@sgia/types';
import { get, post } from '../http';

export async function fetchEquipos(): Promise<Equipo[]> {
  return get<Equipo[]>('/equipos');
}

export async function fetchEquipo(id: number): Promise<Equipo> {
  return get<Equipo>(`/equipos/${id}`);
}

export async function createNovedad(payload: CreateNovedadPayload): Promise<Novedad> {
  const form = new FormData();
  form.append('equipoId', String(payload.equipoId ?? ''));
  form.append('productoId', String(payload.productoId ?? ''));
  form.append('tipo', payload.tipo);
  form.append('descripcion', payload.descripcion);
  if (payload.adjunto) {
    form.append('adjunto', payload.adjunto);
  }
  return post<FormData, Novedad>('/novedades', form);
}