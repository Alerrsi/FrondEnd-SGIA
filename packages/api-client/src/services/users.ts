import type {
  CreateUsuarioPayload,
  PaginatedResponse,
  UpdateUsuarioPayload,
  UserQueryParams,
  UsuarioSinPassword,
} from "@sgia/types";
import { del, get, patch, post } from "../http";
import { normalizeUser } from "./auth";

function normalizePaginatedUsers(
  res: any,
): PaginatedResponse<UsuarioSinPassword> {
  const rawList = Array.isArray(res) ? res : res?.data ?? [];
  const data = rawList.map(normalizeUser);
  const meta = res?.meta ?? {
    currentPage: res?.current_page ?? 1,
    lastPage: res?.last_page ?? 1,
    perPage: res?.per_page ?? data.length,
    total: res?.total ?? data.length,
  };
  return { data, meta };
}

export async function fetchUsers(
  params?: UserQueryParams,
): Promise<PaginatedResponse<UsuarioSinPassword>> {
  const query = new URLSearchParams();
  if (params?.role) query.set("role", params.role);
  if (params?.rol_id) query.set("rol_id", String(params.rol_id));
  if (params?.panol_id) query.set("panol_id", String(params.panol_id));
  if (params?.area) query.set("area", params.area);
  if (params?.is_active !== undefined) query.set("is_active", String(params.is_active));
  if (params?.search) query.set("search", params.search);
  if (params?.per_page) query.set("per_page", String(params.per_page));
  if (params?.page) query.set("page", String(params.page));

  const qs = query.toString();
  const response = await get<any>(`/users${qs ? `?${qs}` : ""}`);
  return normalizePaginatedUsers(response);
}

export async function fetchUser(id: number): Promise<UsuarioSinPassword> {
  const response = await get<any>(`/users/${id}`);
  return normalizeUser(response?.data ?? response);
}

export async function createUsuario(payload: CreateUsuarioPayload): Promise<UsuarioSinPassword> {
  const name = payload.nombre ?? payload.name;
  const role = payload.rol ?? payload.role;
  const body: Record<string, any> = {
    nombre: name,
    name: name,
    email: payload.email,
    password: payload.password,
    password_confirmation: payload.password_confirmation ?? payload.password,
    activo: payload.activo ?? payload.is_active ?? true,
    is_active: payload.activo ?? payload.is_active ?? true,
  };

  if (payload.rol_id !== undefined) body.rol_id = payload.rol_id;
  if (role) {
    body.role = role;
    body.rol = role;
  }
  if (payload.panol_id !== undefined) body.panol_id = payload.panol_id;
  if (payload.carreras !== undefined) body.carreras = payload.carreras;
  if (payload.area !== undefined) body.area = payload.area;
  if (payload.run !== undefined) body.run = payload.run;

  const response = await post<any, any>("/users", body);
  return normalizeUser(response?.data ?? response);
}

export async function updateUsuario(
  id: number,
  payload: UpdateUsuarioPayload,
): Promise<UsuarioSinPassword> {
  const body: Record<string, any> = {};
  if (payload.nombre !== undefined || payload.name !== undefined) {
    const val = payload.nombre ?? payload.name;
    body.nombre = val;
    body.name = val;
  }
  if (payload.email !== undefined) body.email = payload.email;
  if (payload.rol_id !== undefined) body.rol_id = payload.rol_id;
  if (payload.rol !== undefined || payload.role !== undefined) {
    const r = payload.rol ?? payload.role;
    body.role = r;
    body.rol = r;
  }
  if (payload.panol_id !== undefined) body.panol_id = payload.panol_id;
  if (payload.carreras !== undefined) body.carreras = payload.carreras;
  if (payload.area !== undefined) body.area = payload.area;
  if (payload.activo !== undefined || payload.is_active !== undefined) {
    const act = payload.activo ?? payload.is_active;
    body.activo = act;
    body.is_active = act;
  }
  if (payload.password) {
    body.password = payload.password;
    body.password_confirmation = payload.password_confirmation ?? payload.password;
  }

  const response = await patch<any, any>(`/users/${id}`, body);
  return normalizeUser(response?.data ?? response);
}

export async function deleteUsuario(id: number): Promise<void> {
  return del<void>(`/users/${id}`);
}

export async function setUsuarioActivo(id: number, activo: boolean): Promise<UsuarioSinPassword> {
  const response = await patch<{ is_active: boolean; activo: boolean }, any>(`/users/${id}/status`, {
    is_active: activo,
    activo: activo,
  });
  return normalizeUser(response?.data ?? response);
}
