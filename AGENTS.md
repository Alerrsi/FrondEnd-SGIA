# AGENTS.md — SGIA Frontend Monorepo (Web + Mobile)

Este archivo entrega contexto de negocio, técnico y de diseño para cualquier agente de IA (Claude Code u otro) que trabaje sobre este repositorio. Léelo antes de generar o modificar código.

## 0. Alcance de este repositorio

**Este repositorio es un monorepo que contiene el panel web (React) y la app móvil (React Native/Expo) del sistema SGIA, más el código compartido entre ambos.**

- No contiene la API (eso vive en `sgia-backend`, Laravel). Ambas apps consumen esa API vía HTTPS/JSON.
- No implementa reglas de negocio ni validaciones de autoridad final: solo valida en cliente por UX, la fuente de verdad siempre es la respuesta de la API.
- **Web (`apps/web`)** es para los roles AD-01 (Administrador), DIR-01 (Director/Coordinador) y PAN-01 (Pañol).
- **Mobile (`apps/mobile`)** es exclusivamente para PRO-01 (Profesor): solicitud de préstamos remotos y reportes de novedades/fallas.
- El código compartido (`packages/`) existe para evitar duplicar el cliente de API, los tipos de datos y la lógica de validación entre las dos apps — no para compartir UI visual (web usa DOM, mobile usa componentes nativos, son superficies distintas).

## 1. Contexto del proyecto

**Nombre:** SGIA – Sistema de Gestión de Inventario y Activos (Frontend)
**Cliente:** Área de Informática y Ciberseguridad, INACAP Sede Temuco
**Problema que resuelve:** hoy el área gestiona el pañol con Excel, Word y papel, sin trazabilidad de stock, ubicación de equipos, ni historial de préstamos o cotizaciones. Este monorepo entrega las dos interfaces (web y móvil) que reemplazan esos procesos manuales por flujos digitales.

> Nota: el documento de formulación original del proyecto especifica Flutter para el componente móvil. Si el equipo migra a React Native, dejar constancia del cambio de stack en la documentación académica del proyecto.

## 2. Estructura del monorepo

```
sgia-frontend/
├── apps/
│   ├── web/              # Panel administrativo (Vite + React) — AD-01, DIR-01, PAN-01
│   └── mobile/           # App móvil (Expo + React Native) — PRO-01
├── packages/
│   ├── api-client/       # Cliente HTTP tipado + hooks de TanStack Query hacia la API Laravel
│   ├── types/            # Tipos/interfaces compartidos (Producto, Préstamo, Cotización, Usuario, Equipo...)
│   ├── config/           # tsconfig, eslint, prettier compartidos
│   └── design-tokens/    # Colores, tipografía, espaciado (JSON/TS) usados por web (Tailwind) y mobile (NativeWind)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

- `api-client` expone funciones y hooks (`useProducts`, `useLoans`, `useQuotations`, etc.) que ambas apps consumen — evita reescribir llamadas a la API en cada plataforma.
- `types` es la fuente única de verdad de las formas de datos (idealmente generados o validados contra el contrato de la API del backend).
- El manejo de sesión (token) usa una interfaz común definida en `api-client`, con implementación de almacenamiento distinta por plataforma (localStorage en web, SecureStore/AsyncStorage en mobile).

## 3. Roles y qué app/pantalla les corresponde

| Rol | App | Pantallas principales |
|-----|-----|------------------------|
| AD-01 | web | Gestión de usuarios (alta, edición, activar/desactivar). |
| DIR-01 | web | Alta de productos vía escaneo de factura, cotizaciones, fichas técnicas/informes, dashboards. |
| PAN-01 | web | Inventario, ubicación, stock, cola de préstamos, registro de préstamo presencial, historial. |
| PRO-01 | mobile | Solicitud de préstamo remoto, listado de solicitudes propias, formulario de informe de novedades/reposición. |

## 4. Tareas desglosadas por requisito

### Web (`apps/web`)

**REQ-01 — Login (FU-01)**
- [ ] Pantalla de login, manejo de token vía `api-client`, redirección por rol, rutas protegidas.

**REQ-02 — Administración de usuarios (FU-01, AD-01)**
- [ ] Tabla de usuarios con búsqueda/filtro/paginación (TanStack Table).
- [ ] Formulario de alta/edición (React Hook Form) y activar/desactivar con confirmación.

**REQ-03 / REQ-04 — Alta y edición de productos (FU-02, DIR-01 y PAN-01)**
- [ ] Flujo "subir factura → borrador extraído → confirmar/editar → guardar".
- [ ] Formulario de producto y vista de detalle con código de barras (SVG).
- [ ] Activar/desactivar sin eliminar.

**REQ-05 — Ubicación física (FU-02)**
- [ ] Selector de sala/cajón en formulario y detalle; filtro de inventario por ubicación.

**REQ-06 — Alertas de stock crítico (FU-02)**
- [ ] Badge de stock bajo en listados; centro de notificaciones para AD-01 y PAN-01.

**REQ-07 / REQ-08 — Cotizaciones (FU-03, DIR-01)**
- [ ] Selector múltiple de productos + cantidad.
- [ ] Vista de estado (`pendiente`/`en camino`/`completa`) con badges; historial filtrable.

**REQ-09 / REQ-10 / REQ-11 — Préstamos (FU-04, PAN-01)**
- [ ] Cola de solicitudes remotas (cantidad solicitada, disponible, ubicación).
- [ ] Acciones aceptar/rechazar (motivo obligatorio en rechazo).
- [ ] Formulario de préstamo presencial con captura desde pistola de código de barras (funciona como input de teclado, sin librería especial).
- [ ] Historial con distinción visual `procesados` (atenuado) vs `en proceso` (destacado).

**REQ-12 / REQ-13 — Fichas técnicas y novedades (FU-05, DIR-01)**
- [ ] Listado de equipos con ficha técnica descargable (PDF servido por la API).
- [ ] Vista de informes de novedades por equipo.

**REQ-14 — Dashboards (FU-06, DIR-01)**
- [ ] Gráficos de productos/insumos más solicitados, distribución por carrera, menos demandados, ranking de profesores (react-chartjs-2).

**REQ-NF-03 / REQ-NF-04 (web)**
- [ ] Contraste AA, navegación por teclado, foco visible.
- [ ] Paginación/virtualización en tablas largas, lazy loading de imágenes, code-splitting por ruta.

### Mobile (`apps/mobile`)

**REQ-09 — Solicitud de préstamo remoto (FU-04, PRO-01)**
- [ ] Pantalla de nueva solicitud (insumo/producto, cantidad, asignatura, sala, fecha) con selector nativo.
- [ ] Confirmación visual "solicitud enviada" tras el envío.
- [ ] Listado de solicitudes propias con estado (`en proceso` / `procesada`).

**REQ-13 — Informe de novedades / reposición (FU-05, PRO-01)**
- [ ] Formulario con adjunto opcional (foto/documento) usando el picker nativo de Expo.

**REQ-NF-04 (mobile)**
- [ ] Manejo de estados de carga/offline (la app debe avisar si no hay conexión, no fallar en silencio).
- [ ] Uso de `FlatList` para listados largos (no `ScrollView` con `.map`).

## 5. Arquitectura y manejo de datos

- **Data fetching:** TanStack Query en ambas apps, consumiendo `packages/api-client`. Da cache, reintentos y estados de carga/error consistentes en web y mobile con la misma API de hooks.
- **Formularios:** React Hook Form en ambas apps (misma librería, misma curva de aprendizaje para el equipo).
- **Autenticación:** token guardado vía la interfaz común de `api-client`; implementación concreta de almacenamiento resuelta por plataforma dentro de cada app.
- **Ambas apps son solo clientes de la API:** ninguna decisión de negocio (stock, permisos, estados) se resuelve localmente sin confirmación del backend.

## 6. Estética — inspirada en zed.dev (aplica principalmente a web)

Referencia: https://zed.dev/. Se toma el lenguaje visual "developer tool" (oscuro, alto contraste, preciso), sin el peso de animaciones/video propio de un sitio de marketing, priorizando velocidad percibida.

**Qué sí replicar:**
- Fondo casi negro (`#0d0d0d`–`#111113`), texto casi blanco (`#f5f5f5`), un único color de acento (naranja/rojo) para botones primarios, links y estados activos. Definido en `packages/design-tokens` para reusar en Tailwind (web) y NativeWind (mobile).
- Bordes finos translúcidos en vez de sombras difusas.
- Mono (JetBrains Mono / Fira Code) para IDs, códigos de barras, badges de estado, timestamps. Sans (Inter) para el resto.
- Radios de borde moderados (8–10px), espaciado generoso, micro-interacciones vía transiciones CSS simples.

**Qué NO replicar:**
- Videos autoplay, parallax, animaciones de scroll complejas.
- En mobile, no forzar el mismo layout de grilla web: respetar convenciones nativas (safe areas, gestos, tamaños táctiles) manteniendo solo la paleta y tipografía.

## 7. Convenciones de código sugeridas para agentes

- Un solo componente/hook por archivo, agrupado por módulo (`inventario/`, `prestamos/`, `cotizaciones/`, `usuarios/`, `dashboard/`) en ambas apps, siguiendo la nomenclatura FU-01 a FU-06.
- Toda llamada a la API pasa por `packages/api-client`, nunca `fetch` disperso dentro de componentes de `apps/web` o `apps/mobile`.
- Los tipos de dominio (Producto, Préstamo, Cotización, Usuario, Equipo) viven únicamente en `packages/types`; no redefinir localmente en cada app.
- Estados de préstamo/cotización como enum/const compartido en `packages/types`, no strings sueltos, para que los badges de color sean consistentes entre web y mobile.
- TypeScript estricto en todo el monorepo.

## 8. Tecnologías

- **Gestor de monorepo:** Turborepo + pnpm workspaces (liviano, sin la curva de Nx, suficiente para el tamaño de este proyecto).
- **Web:**
  - **Build/framework:** Vite + React (SPA, sin necesidad de SSR al ser un panel interno autenticado).
  - **Routing:** React Router.
  - **CSS:** Tailwind CSS.
  - **Componentes headless/accesibles:** Radix UI (Dialog, Select, Tabs, Dropdown) — sin estilos propios, encajan con la estética minimalista de la sección 6.
  - **Tablas:** TanStack Table (headless, liviana, se integra nativamente con React y con TanStack Query).
  - **Fecha:** react-day-picker.
  - **Toasts:** react-hot-toast (liviano, reemplaza confirmaciones simples).
  - **Gráficos (dashboards, FU-06):** Chart.js + react-chartjs-2, tema oscuro con el acento definido en design-tokens.
  - **Iconos:** lucide-react.
  - **Syntax highlight** (si se muestra JSON/logs): Shiki.
- **Mobile:**
  - **Framework:** React Native con Expo (mayor velocidad de desarrollo/build para el plazo del proyecto de título; opción de eject si se necesita más adelante).
  - **Estilos:** NativeWind (Tailwind para React Native, reusa los mismos tokens que la web).
  - **Navegación:** React Navigation (o Expo Router).
  - **Iconos:** lucide-react-native.
  - **Cámara/adjuntos:** `expo-image-picker` / `expo-document-picker` para el formulario de novedades.
- **Compartido:**
  - **Data fetching:** TanStack Query.
  - **Formularios:** React Hook Form.
  - **Lenguaje:** TypeScript en todo el monorepo.
- **Testing:** Vitest + React Testing Library (web), Jest + React Native Testing Library (mobile).

## 9. Referencias del documento fuente

Este archivo se basa en "Formulación del Proyecto de Título - SGIA (Sistema Gestión de Inventario y Activos)", INACAP Sede Temuco, sección TIHI84, entregado 09-09-2026, y en la referencia visual https://zed.dev/ para la estética del panel web. Consultar el documento de formulación para el detalle completo de requisitos, matriz RACI, cronograma y presupuesto.
