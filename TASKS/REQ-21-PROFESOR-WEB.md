# REQ-21: Interfaces Web del Profesor (PRO-01) y Atajo de Login de Desarrollo

> **Código:** `REQ-21` | **Módulo:** `FU-04` / `FU-05` (Préstamos remotos e Informes de novedades)
> **Plataforma:** Web (`apps/web`)
> **Roles:** Docente / Profesor (`PRO-01`)

---

## 🎯 Objetivo

Nuevo requisito: el profesor deja de ser exclusivo de la app móvil y debe poder trabajar también en la plataforma web con **todas sus funciones** (las mismas que tiene en `apps/mobile`): catálogo y solicitud de préstamo remoto (REQ-09), seguimiento de sus solicitudes e informes de novedades (REQ-13).

Decisiones tomadas:

- Alcance: rol `PRO-01` en web con las funciones del móvil.
- Layout: el mismo `app-layout` con menú reducido a las rutas permitidas a `PRO-01`.
- Atajo de login: **autologin de desarrollo**, visible solo con `import.meta.env.DEV`.

### Campos de la solicitud de préstamo

| Campo | Entrada | Obligatorio | Se envía como |
|---|---|:---:|---|
| Profesor | Automático (usuario autenticado), solo lectura | Sí | Lo toma el backend del token |
| Carrera | Selector con todas las carreras (`useCareers`); el profesor no necesita tener carreras asignadas | Sí | `career_id` |
| Asignatura | Texto | Sí | `subject` |
| Fecha de actividad | Fecha, no pasada | Sí | `loan_date` (`YYYY-MM-DD`) |
| Hora de inicio | `HH:MM` | Sí | `start_time` |
| Hora de término | `HH:MM`, posterior a la de inicio | Sí | `end_time` |
| Laboratorio | Selector con `GET /api/locations?tipo=sala\|taller&storeroom_id=…`, filtrado por el pañol elegido | Sí | `location_id` |
| Pañol a solicitar | Selector con `GET /api/storerooms` (por defecto el del profesor, `storeroom_id` de `/api/me`) | Sí | `storeroom_id` |
| Lista de insumos | Filas de producto + cantidad (mínimo 1, sin repetir producto) | Sí | `items: [{product_id, quantity}]` |

> **Contrato con el backend:** estos campos requieren ampliar `POST /api/loans/requests` (hoy solo `items`, `subject`, `room`, `loan_date`, `time_block`, `notes`). El prompt para el backend está en [REQ-21-PROMPT-BACKEND.md](./REQ-21-PROMPT-BACKEND.md). Hasta que el backend lo implemente, el frontend no puede enviar `start_time`, `end_time`, `location_id` ni `storeroom_id`.
> **Decisiones:** Laboratorio es un selector alimentado por la API (no texto libre); Profesor es solo el usuario autenticado (`PRO-01`), sin crear solicitudes a nombre de otro.

> Solo la solicitud de préstamo necesita cambios en la API (ver arriba); novedades y cancelación no. `packages/api-client` ya expone `useProducts`, `useCareers`, `useCreatePrestamo`, `useMyLoanRequests`, `useCancelLoanRequest`, `useMyIncidentReports`, `useCreateIncidentReport` y las descargas de PDF, firma y foto del informe.

---

## 📡 Endpoints utilizados (`ENDPOINTS.md`)

| Método | Endpoint | Uso |
|---|---|---|
| `GET` | `/api/products` | Catálogo para la solicitud |
| `POST` | `/api/loans/requests` | Crear solicitud remota (`items`, `subject`, `room`, `loan_date`, `time_block`, `notes`) |
| `GET` | `/api/loans/my-requests` | Mis solicitudes |
| `DELETE` | `/api/loans/requests/{id}` | Cancelar solicitud en estado `pendiente` |
| `POST` | `/api/equipment/{id}/reports` | Crear informe de novedades (`multipart/form-data`) |
| `GET` | `/api/products/{id}/units` | Elegir la unidad en equipos y maquetas |
| `GET` | `/api/careers` | Carreras del formulario |

---

## 📋 Lista de Tareas Desglosada

### 1. Roles y acceso (`apps/web/src/features/auth`)
- [x] Agregar `PRO-01` a `WebRoleCode` y `WEB_ROLES` en `types/roles.ts`.
- [x] Definir la ruta de inicio del profesor en `ROLE_DEFAULT_PATH` (`/profesor/solicitudes`).
- [x] Registrar en `ROUTE_PERMISSIONS` las rutas `/profesor/catalogo`, `/profesor/solicitudes` y `/profesor/novedades` solo para `PRO-01` (`canAccessRoute` deja pasar rutas sin entrada).
- [x] Verificar que `PRO-01` no tenga acceso a ninguna ruta del panel administrativo.
- [x] Revisar que `isWebRole` (coincidencia por texto) no acepte roles no previstos. (Nota: `normalizeRoleCode` de `api-client` devuelve `PRO-01` como rol por defecto; un rol desconocido ya no se rechaza en web, el backend sigue aplicando permisos.)
- [x] `context/auth-context.tsx`: el rechazo «solo móvil» deja de aplicar a `PRO-01` y sigue para otros roles.
- [x] `pages/login.tsx`: reemplazar el texto «Docentes (PRO-01): usan la app móvil».
- [x] Actualizar `types/roles.test.ts` (hoy afirma que `PRO-01` queda excluido).

### 2. Layout con menú reducido (`apps/web/src/layouts/app-layout.tsx`)
- [x] Agregar las entradas Catálogo, Mis solicitudes y Novedades con `roles: ['PRO-01']`.
- [x] Mantener sin cambios las entradas de `AD-01`, `DIR-01` y `PAN-01`; el profesor solo ve las suyas.
- [x] Sidebar colapsado (`isCollapsed === true`): `IconBar` siempre vertical (`axis="column"`); el layout no se tocó salvo las tres entradas.
- [x] Ajustar `layouts/app-layout.test.tsx`.

### 3. Pantallas (`apps/web/src/features/profesor/`, un componente o hook por archivo)
- [x] **Catálogo y nueva solicitud** (equivale a `mobile/(app)/index.tsx`; `features/profesor/pages/catalogo-page.tsx`):
  - [x] Formulario con React Hook Form + Zod con los campos de la tabla «Campos de la solicitud de préstamo»: profesor (solo lectura), carrera, asignatura, fecha de actividad, hora de inicio, hora de término, laboratorio y pañol.
  - [x] Validaciones: fecha no pasada, hora de término posterior a la de inicio, todos los campos obligatorios y mínimo 1 insumo.
  - [x] Lista de insumos: cada fila con producto y cantidad (máximo el stock disponible); se agregan desde el catálogo (productos activos con stock, con buscador) y se pueden quitar; sin productos repetidos.
  - [x] Pañol: selector con `GET /api/storerooms`, precargado con el pañol del profesor.
  - [x] Laboratorio: selector con `GET /api/locations` (salas y talleres), filtrado por el pañol elegido; se reinicia al cambiar de pañol.
  - [x] Enviar `career_id`, `storeroom_id`, `location_id`, `start_time` y `end_time` (sin `room` ni `time_block`, que el backend deriva).
  - [x] Confirmación con el código `REM-<año>-XXXXXX` y paso a «Mis solicitudes».
  - [x] Errores 422 del backend (stock, fecha) mostrados con `apiErrorToMessage`.
- [x] **Mis solicitudes** (equivale a `explore.tsx`; `features/profesor/pages/mis-solicitudes-page.tsx`):
  - [x] Tabla con código en `font-mono`; columnas: código, carrera, asignatura, fecha, horario, laboratorio, pañol, estado.
  - [x] Detalle de la solicitud con su lista de insumos (producto y cantidad) y notas.
  - [x] Estado con el componente `Badge`: `pendiente`, `en_proceso`, `procesado`, `rechazado`; filtro por estado.
  - [x] Motivo de rechazo visible en el detalle.
  - [x] Cancelar solo si está `pendiente`, con diálogo de confirmación (`useCancelLoanRequest`).
- [x] **Novedades** (equivale a `novedades.tsx` y `new-incident-modal.tsx`; `features/profesor/pages/mis-novedades-page.tsx`):
  - [x] Lista de mis informes con `useMyIncidentReports`, detalle y descarga del PDF (reutiliza `IncidentDetailSheet` de `features/novedades`).
  - [x] Diálogo de nuevo informe con el contrato vigente (`POST /api/incident-reports`): asignatura, fecha (no futura), laboratorio (`location_id`), problemas marcados con descripción obligatoria, sugerencia, código de equipo o insumo (opcional) y foto de evidencia (jpg/png/webp, máx. 10 MB).
  - [x] Componente de firma con `<canvas>` que entrega PNG en base64.
  - [x] Envío con `useCreateIncidentReport`.
- [x] Diseño según el skill `sgia-design`; el rojo institucional solo para alertas críticas.

### 4. Rutas (`apps/web/src/app.tsx`)
- [x] Tres rutas `/profesor/*` dentro de `RequireAuth` y `RequireRole allowedRoles={['PRO-01']}` (por ahora con `ProfesorPendientePage` como marcador; se reemplaza al implementar cada pantalla).
- [x] `RootRoute` redirige a `PRO-01` a su inicio (vía `getRoleDefaultPath`).
- [x] Un `AD-01`, `DIR-01` o `PAN-01` que entra a `/profesor/*` ve `ForbiddenPage`.

### 5. Atajo de login de desarrollo (`pages/login.tsx`)
Se sigue el patrón existente de «Accesos rápidos de prueba» (usuarios `@sgia.cl` del seeder del backend con la contraseña de desarrollo compartida); el usuario `docente@sgia.cl` (PRO-01) ya existe en `DatabaseSeeder` del backend.
- [x] Botón «PRO-01 (Profesor)» en los accesos rápidos, con `docente@sgia.cl`.
- [x] Lista «Roles autorizados en web» incluye `PRO-01`; se quitó el aviso «Docentes usan la app móvil».
- [ ] Revisar `handleQuickFill`: la contraseña de desarrollo está escrita en el código; decidir si se saca a una variable de entorno o se oculta fuera de desarrollo (aplica a todos los accesos rápidos).

### 6. Documentación
- [x] Actualizar `AGENTS.md` (tabla de roles y la línea «Mobile exclusivo para PRO-01»).
- [x] Actualizar `CLAUDE.md` (línea «Roles AD-01, DIR-01, PAN-01» de `apps/web`).
- [x] Actualizar `TASKS/REQ-01`, `REQ-09` y `REQ-13` (plataforma Web para `PRO-01`).
- [x] Registrar el cambio en `FIXES/CHANGELOG-FIXES.md`.

---

## 🧪 Pruebas Requeridas

- [x] Unit test `roles.test.ts`: `PRO-01` es rol web, su ruta de inicio, accesos permitidos y denegados.
- [x] Component test de la solicitud (`loan-request-form.test.tsx`, `loan-request-schema.test.ts`, `loan-request-api.test.ts`): campos obligatorios, hora de término posterior a la de inicio, fecha no pasada, mínimo 1 insumo, sin productos repetidos y payload enviado (`career_id`, `start_time`, `end_time`, `location_id`, `storeroom_id`, `items`).
- [x] Component test de Mis solicitudes (`mis-solicitudes-page.test.tsx`): Cancelar solo en `pendiente`, detalle y filtro.
- [x] Component test de Novedades (`new-incident-dialog.test.tsx`, `incident-form-schema.test.ts`): campos obligatorios, descripción por problema, foto y envío.
- [x] Test de login: `PRO-01` inicia sesión en la web y va a `/profesor/solicitudes`.
- [x] Test de rutas: `PRO-01` en `/usuarios` ve `ForbiddenPage`; `AD-01` en `/profesor/*` también.
- [x] `pnpm typecheck` y `pnpm --filter @sgia/web test` pasan.
- [x] Comprobación visual en Chromium con capturas (API simulada): login con acceso rápido, menú reducido y las tres pantallas.

---

## ✅ Prueba con la API real (2026-11-05)

Con `docente@sgia.cl` en `localhost:8000` y Chromium: login con el acceso rápido, nueva solicitud (pañol, laboratorio, insumo), listado, detalle y cancelación (`DELETE`); informe de novedades con firma dibujada, foto y equipo por código, detalle con firma y foto, PDF (`200 application/pdf`). Validaciones 422 del backend (horas, fecha pasada, laboratorio de tipo pañol, stock) coinciden con el formulario. El profesor recibe `403` al cambiar el estado de un informe, por eso el detalle es de solo lectura para él. Requiere `php artisan migrate` en el backend. El profesor de prueba no tiene pañol ni carreras asignadas: el selector de pañol parte vacío.

## ❓ Pendientes de confirmar

- [x] Rutas `/profesor/catalogo`, `/profesor/solicitudes` y `/profesor/novedades` (confirmadas).
- [x] Usuario `PRO-01` de desarrollo: `docente@sgia.cl`, ya sembrado en el backend (`DatabaseSeeder`).
- [ ] Si se puede quitar la contraseña escrita en `handleQuickFill` (afecta a todos los accesos rápidos).
- [x] Backend: implementar el prompt de [REQ-21-PROMPT-BACKEND.md](./REQ-21-PROMPT-BACKEND.md) antes de la pantalla de solicitud (bloquea el envío real).
- [x] Laboratorio: selector alimentado por la API.
- [x] Profesor: solo el usuario autenticado (`PRO-01`).
- [x] Carrera: el profesor no tiene carreras asignadas; el selector lista todas, sin restringir ni preseleccionar (emergencias).

---

## 🔀 Orden de trabajo

1. Roles y acceso, con sus tests.
2. Layout y rutas.
3. (Backend) implementar el prompt de `REQ-21-PROMPT-BACKEND.md`.
4. Solicitudes: catálogo, nueva solicitud y mis solicitudes.
5. Novedades, con firma y foto.
6. Atajo de login de desarrollo.
7. Documentación y verificación.

---

## ✅ Disponibilidad por pañol en la solicitud (contrato: `BackEnd-SGIA/docs/disponibilidad-por-panol.md`)

- [x] El catálogo pide `GET /api/products?storeroom_id=` con el pañol elegido y muestra `available_in_storeroom` como existencias y máximo de la cantidad.
- [x] Producto con `0` en el pañol: botón deshabilitado y aviso "Sin existencias en este pañol".
- [x] Sin pañol elegido no se ofrecen cantidades ("Elige un pañol para ver sus existencias").
- [x] Al cambiar de pañol se actualizan las existencias de lo ya agregado y se avisa qué ya no alcanza (la validación de cantidad marca el error).
- [x] Se mantiene el manejo del `422` de la solicitud (el dato no reserva unidades).
- [ ] Limitación: solo se revalidan los productos presentes en la página del catálogo cargada (30); los demás quedan al `422` del backend.
