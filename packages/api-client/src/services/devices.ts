import { del, post } from '../http';

export type DevicePlatform = 'ios' | 'android';

/** Registra el token de push de Expo del dispositivo (`POST /devices`); si ya existía pasa a este usuario. */
export function registerDevice(token: string, platform?: DevicePlatform): Promise<{ id: number }> {
  return post<{ token: string; platform?: DevicePlatform }, { id: number }>('/devices', { token, platform });
}

/** Elimina un token propio (`DELETE /devices/{id}`); se llama al cerrar sesión. */
export function unregisterDevice(id: number): Promise<void> {
  return del<void>(`/devices/${id}`);
}
