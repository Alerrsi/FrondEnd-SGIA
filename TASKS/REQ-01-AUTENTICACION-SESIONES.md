# REQ-01: Autenticación, Sesiones y Seguridad de Acceso

> **Código:** `REQ-01` | **Módulo:** `FU-01` (Gestión de Usuarios y Seguridad)  
> **Plataformas:** Web (`apps/web`) y Mobile (`apps/mobile`)  
> **Roles:** Todos (`AD-01`, `DIR-01`, `PAN-01`, `PRO-01`)

---

## 🎯 Objetivo

Implementar un flujo de autenticación seguro, centralizado y persistente vía Laravel Sanctum con tokens Bearer diferenciados por dispositivo (`device_name = web | mobile`), control de acceso por roles (RBAC) y gestión de sesiones activas.

---

## 📡 Endpoints del Backend (`ENDPOINTS.md`)

| Método | Endpoint | Roles | Descripción | Estado API |
|---|---|---|---|:---:|
| `POST` | `/api/login` | Público | Autenticación con email, password y `device_name` (`web` \| `mobile`). Retorna Bearer token y usuario. | ✅ Listo |
| `GET` | `/api/me` | Auth | Retorna datos del usuario autenticado (`UserResource`). | ✅ Listo |
| `PUT` | `/api/password` | Auth | Cambio de contraseña con validación de contraseña actual y complejidad. | ✅ Listo |
| `POST` | `/api/logout` | Auth | Revocación del token actual de la sesión. | ✅ Listo |
| `POST` | `/api/logout-all` | Auth | Revoca todas las sesiones activas del usuario. | ✅ Listo |
| `GET` | `/api/tokens` | Auth | Lista sesiones y dispositivos activos con fechas y vigencia. | ✅ Listo |
| `DELETE` | `/api/tokens/{tokenId}` | Auth | Cierra una sesión remota específica por su ID. | ✅ Listo |
| `POST` | `/api/tokens/revoke-others` | Auth | Revoca todas las sesiones excepto la que realiza la petición. | ✅ Listo |

---

## 📋 Lista de Tareas Desglosada

### 1. Panel Web (`apps/web`)
- [x] **Pantalla de Login:**
  - [x] Formulario con campos `email`, `password` y validaciones con React Hook Form.
  - [x] Toggle visual para mostrar/ocultar contraseña.
  - [x] Manejo de estados de carga (`isSubmitting`) y deshabilitación de inputs.
  - [x] Mensajes de error claros ante credenciales inválidas (HTTP 401 o 422).
- [x] **Manejo de Sesión y Token Storage:**
  - [x] Implementación de `TokenStorage` con `localStorage` (`sgia_token`).
  - [x] Integración de `AuthContext` y `AuthProvider` para sincronización de sesión.
  - [x] Auto-cierre de sesión (limpieza de token y query cache) ante respuestas HTTP 401.
- [x] **Rutas Protegidas y RBAC:**
  - [x] Componente `ProtectedRoute` para bloquear accesos no autenticados.
  - [x] Validación de rol de acceso (`isWebRole` excluye a `PRO-01` en web con redirección/mensaje adecuado).
  - [x] Redirección automática según el rol al iniciar sesión:
    - `AD-01` ➔ `/usuarios`
    - `DIR-01` ➔ `/` (Dashboard)
    - `PAN-01` ➔ `/inventario`
  - [x] Pantalla `ForbiddenPage` (403) ante intentos de navegación no autorizados.
- [ ] **Modal de Cambio de Contraseña:**
  - [ ] Diálogo accesible con Radix UI para cambio de contraseña desde el header/perfil.
  - [ ] Validación de coincidencia de contraseña nueva y confirmación.
  - [ ] Notificación toast de confirmación y cierre seguro.
- [ ] **Gestión de Dispositivos y Sesiones Activas:**
  - [ ] Vista o pestaña de perfil para ver sesiones abiertas (`GET /api/tokens`).
  - [ ] Botón para cerrar sesiones en otros dispositivos (`POST /api/tokens/revoke-others`).

### 2. App Móvil (`apps/mobile`)
- [ ] **Pantalla de Login Nativa:**
  - [ ] Formulario con NativeWind adaptado a teclado táctil (`KeyboardAvoidingView`).
  - [ ] Envío explícito de `device_name: 'mobile'` (vigencia de token de 60 días).
  - [ ] Validación de que solo usuarios con rol `PRO-01` puedan iniciar sesión en la app.
- [ ] **Almacenamiento Seguro Móvil:**
  - [ ] Implementar `TokenStorage` usando `expo-secure-store`.
  - [ ] Restauración automática de sesión al abrir la app.
- [ ] **Cierre de Sesión:**
  - [ ] Botón de cierre de sesión en drawer/perfil que llama a `POST /api/logout` y limpia el SecureStore.

---

## 🧪 Pruebas Requeridas

- [x] Unit test: almacenamiento y eliminación de token en `TokenStorage`.
- [x] Unit test: permisos de rutas por rol (`canAccessRoute` y `getRoleDefaultPath`).
- [ ] Integration test: flujo de login exitoso y manejo de errores 401/422.
