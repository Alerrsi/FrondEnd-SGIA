# REQ-NF: Requisitos No Funcionales — Accesibilidad, Performance y Experiencia

> **Códigos:** `REQ-NF-03` (Accesibilidad y Usabilidad) y `REQ-NF-04` (Rendimiento, Escalabilidad y Offline)  
> **Plataformas:** Web (`apps/web`) y Mobile (`apps/mobile`)  
> **Roles:** Aplica transversalmente a todos los usuarios del sistema

---

## 🎯 Objetivo

Garantizar que tanto el panel web como la aplicación móvil cumplan con los estándares internacionales de accesibilidad digital (WCAG 2.1 nivel AA), tiempos de carga inferiores a 1 segundo en interacción local, navegación fluida por teclado para el pañolero y tolerancia a fallos de red en dispositivos móviles.

---

## 📋 Lista de Tareas Desglosada

### 1. Accesibilidad y Ergonomía Visual (`REQ-NF-03`)
- [ ] **Contraste de Color WCAG 2.1 AA:**
  - [x] Fondo casi negro (`#0d0d0d`) con texto blanco suave (`#f5f5f5`) cumpliendo ratio superior a 7:1 en textos principales.
  - [ ] Verificar contraste en textos secundarios (`text-muted`) y badges de estado para asegurar ratio mínimo de 4.5:1.
- [ ] **Navegación por Teclado en Web:**
  - [x] Foco visible claro (`focus-visible:ring-1` o `outline-accent`) en todos los botones, inputs y enlaces.
  - [ ] Atajos de teclado para operaciones rápidas en pañol:
    - `F2` o `/`: Ir directamente al buscador de inventario.
    - `Alt + P`: Ir al modo mostrador de préstamo presencial.
    - `Esc`: Cerrar modales y limpiar búsquedas.
  - [ ] Captura de foco accesible (Focus trapping) en modales usando Radix UI Dialog.
- [ ] **Semántica HTML y Lectores de Pantalla:**
  - [x] Atributos `aria-label` en botones de iconos puros (editar, eliminar, cerrar).
  - [x] Roles semánticos en alertas (`role="alert"`).

### 2. Rendimiento y Escalabilidad Web (`REQ-NF-04 - Web`)
- [ ] **División de Código por Ruta (Code-Splitting):**
  - [ ] Implementar `React.lazy()` y `Suspense` con skeletons de carga para cada ruta principal (`/usuarios`, `/inventario`, `/prestamos`, `/cotizaciones`, `/dashboard`).
- [ ] **Paginación y Virtualización en Tablas Extensas:**
  - [x] Paginación eficiente con TanStack Table en usuarios e inventario.
  - [ ] Virtualización de filas para catálogos con más de 500 ítems usando `@tanstack/react-virtual`.
- [ ] **Carga Diferida de Recursos (Lazy Loading):**
  - [ ] Lazy loading de imágenes de productos y vistas previas de facturas (`loading="lazy"`).
  - [ ] Caché optimizada en cliente con TanStack Query (5 minutos `staleTime` para datos poco cambiantes).

### 3. Rendimiento y Resiliencia en App Móvil (`REQ-NF-04 - Mobile`)
- [ ] **Optimización de Listados:**
  - [ ] Uso exclusivo de `FlatList` con `windowSize` y `getItemLayout` (prohibido `ScrollView` con `.map()` para listas de productos o préstamos).
- [ ] **Manejo de Conectividad y Modo Offline:**
  - [ ] Detección del estado de red usando `@react-native-community/netinfo`.
  - [ ] Banner no intrusivo en la cabecera cuando el docente pierde conexión ("Sin conexión a internet — Reintentando...").
  - [ ] Prevención de fallos silenciosos: bloqueo amigable del botón de envío si no hay red con mensaje claro.
- [ ] **Ergonomía Táctil:**
  - [ ] Áreas de toque mínimas de 48x48 dp para todos los botones y selectores según lineamientos de Android e iOS.
  - [ ] Respeto estricto de las zonas seguras del dispositivo (`SafeAreaView`).

---

## 🧪 Pruebas y Auditorías Requeridas

- [ ] Auditoría automatizada de accesibilidad con Lighthouse (Score >= 95 en accesibilidad).
- [ ] Bundle analyzer de Vite para asegurar chunks individuales menores a 200 kB.
