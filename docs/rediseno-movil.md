# Rediseño «Trazo» en la app móvil

**Estado: plan, sin implementar.** Rama: `feat/rediseno-movil`. Solo `apps/mobile` y `packages/design-tokens`. No cambian el backend, la API, la navegación ni el comportamiento. Seguimiento en `TASKS/REQ-DISEÑO.md` (sección «Rediseño Trazo en móvil»).

## 1. Problema

La web ya usa el sistema «Trazo» (`docs/rediseno-interfaz.md`, regla en `.claude/skills/sgia-design/SKILL.md`). La app móvil del profesor (PRO-01) sigue con el diseño anterior y con restos de la plantilla de Expo:

| Hallazgo | Dónde | Hoy | Trazo |
|---|---|---|---|
| Acento rojo | 14 usos de `#d9232a` (login, Solicitar, Novedades) | rojo INACAP | burdeo `#6B1729` (claro) / rosa `#E8A3B1` (oscuro) |
| Neutros fríos | `constants/theme.ts` (`#000`, `#F0F0F3`, `#60646C`…) | gris azulado, fondo blanco/negro puro | papel `#F6F5F2` / grafito `#131210`, superficie `#FFF` / `#1B1A17` |
| Estados con Tailwind crudo | `incident-status.ts`, badges de préstamos (`#d1fae5`, `#dbeafe`, `#fef3c7`, `#b91c1c`…) | verde/azul/ámbar/rojo genéricos | tonos `ok` / `info` / `warn` / `danger` del web |
| Pesos | 19 `fontWeight: 700` | negrita | 400 y 500; 600 solo en cifras; nunca 700 |
| Tamaños | badges a 10 px, título a 48 px, tag con `letterSpacing` | | nada bajo 12 px, título de pantalla 24 px, sin mayúsculas forzadas |
| Fuente | sistema (`system-ui` / `normal`), Spline Sans en web | | Geist en la interfaz, Geist Mono solo para códigos |
| Radios | 3, 6, 8, 12, 16, 26, 40 | | 4 / 6 / 8 y pastilla para botones |
| Splash | logo de Expo sobre azul `#208AEF` (`animated-icon.tsx`, `app.json`) | plantilla | marca SGIA sobre papel/grafito |
| Tabs | iconos de plantilla `home.png` / `explore.png`; en web «Home», «Explore» | | iconos de sistema y etiquetas en español |
| Archivos de plantilla | `web-badge`, `hint-row`, `external-link`, `collapsible`, logos de React/Expo | sin uso real | se borran si nada los importa |

Además `pnpm typecheck` de `@sgia/mobile` falla hoy porque `expo-notifications` no está instalado aunque figura en `package.json`; se arregla en la fase 0.

## 2. Decisiones

1. **Una sola fuente de tokens.** `packages/design-tokens/src/tokens.json` pasa a tener los valores claro y oscuro, los estados y la etiqueta de código (hoy solo tiene el claro y le faltan `info`, fondos de estado y `tag`). La app móvil los lee desde `@sgia/design-tokens`; la web sigue con su `index.css` (mismos valores, sin cambios en esta tarea).
2. **Un solo punto de entrada del tema en móvil:** `apps/mobile/src/theme/` (`colors.ts`, `spacing.ts`, `typography.ts`, `radius.ts`, `motion.ts`, `index.ts`) reemplaza a `constants/theme.ts`. `useTheme()` devuelve la paleta del modo activo. Ninguna pantalla escribe un hex, un `fontSize` ni un radio sueltos.
3. **Modo oscuro según el sistema** (como hoy, `userInterfaceStyle: automatic`). Sin interruptor propio en la app.
4. **Menú como el riel del sidebar web.** Las pestañas nativas (`NativeTabs`) se reemplazan por una barra de iconos propia, igual al `IconBar` del sidebar encogido del web (pozo en superficie con borde de 1 px y radio 16, indicador en `surfaceAlt` con borde que se desliza al ítem activo, sin rebote), pero horizontal y fija abajo, sobre el área segura. Solo iconos (Lucide, los mismos del web) con `accessibilityLabel` y el nombre de la pantalla en su `ScreenHeader`. Se arma con `Tabs`/`TabList`/`TabTrigger` de `expo-router/ui`, una sola implementación para iOS, Android y web.
5. **Lo demás nativo se queda nativo.** `Modal` con `pageSheet`, `Alert`, selector de fecha y estados de carga del sistema: solo se tiñen con los tokens.
6. **Geist con `@expo-google-fonts/geist` y `@expo-google-fonts/geist-mono`**, instaladas con `npx expo install`, pesos 400, 500 y 600 (Mono 400 y 500), cargadas en el layout raíz antes de ocultar el splash. Funciona en Expo Go.
7. **Superficies como en el web:** canvas papel, secciones en superficie blanca con borde de 1 px y radio 8, sin sombras. Las listas dentro de una sección se separan con líneas, no con una tarjeta por fila.

## 3. Tokens móviles

| Token | Claro | Oscuro |
|---|---|---|
| `bg` (canvas) | `#F6F5F2` | `#131210` |
| `surface` | `#FFFFFF` | `#1B1A17` |
| `surfaceAlt` | `#EFEDE8` | `#22211E` |
| `line` / `lineStrong` | `#E2DFD8` / `#CBC7BE` | `#2E2C28` / `#3D3A35` |
| `ink` / `inkMuted` | `#1B1A17` / `#5F5B53` | `#F2F0EB` / `#A19C92` |
| `accent` / `accentSoft` / `accentInk` | `#6B1729` / `#F3E4E3` / `#F6F5F2` | `#E8A3B1` / `#3A1E24` / `#1B1A17` |
| `ok`, `info`, `warn`, `danger` (+ `*Bg`) | valores de `index.css` | valores de `index.css` |
| `tag` / `tagInk` (chip de código) | `#ECE6DA` / `#6B1729` | por definir con el web oscuro |

Espaciado en grilla de 4: `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 24`, `xxl 32`. Borde de pantalla: 16. Radios: `sm 4`, `md 6`, `lg 8`, `full` (botones).

Tipografía (Geist, tipo oración):

| Variante | Uso | Estilo |
|---|---|---|
| `title` | título de pantalla | 24/30, 500, -0.02em |
| `subtitle` | bajada del título | 14/20, 400, secundario |
| `section` | título de sección | 15/20, 500 |
| `label` | etiqueta de campo, rótulo | 13/18, 500 |
| `body` | texto | 14/20, 400 |
| `secondary` | texto secundario | 13/18, 400, secundario |
| `caption` | badges, notas | 12/16, 500 |
| `metric` | cifras | 24/30, 600, tabular |
| `code` | SKU, código de solicitud o informe, serial | Geist Mono 13/18, 500 |

Movimiento: 90 ms al pulsar, 150 ms entrar, 120 ms salir; sin rebote; se respeta «reducir movimiento».

## 4. Componentes (`apps/mobile/src/components/`)

Equivalentes móviles de los del web, con el contrato variante / tamaño / estado / `style` al final:

- `ThemedText` con las variantes de §3 (reemplaza `default`, `title`, `small`, `smallBold`, `subtitle`, `link`, `linkPrimary`, `code`).
- `Button`: `primary` (pastilla burdeo, uno por pantalla), `secondary` (borde de 1 px), `ghost`, `danger`; alto 44, estado pulsado, deshabilitado y cargando con `aria` correcto.
- `Badge` con `tone` (`neutral`, `ok`, `info`, `warn`, `danger`, `accent`), 12 px.
- `CodeChip` para códigos.
- `Section` (superficie con borde 1 px y radio 8; título opcional) y `Row` (fila con línea divisoria).
- `TextField` (etiqueta, campo de 44 px, foco burdeo, error en `danger`); `select-field`, `multi-select-field` y `date-field` se reestilizan con los mismos tokens.
- `EmptyState` y `ErrorState`.
- `ScreenHeader` (título + bajada, opcionalmente acción) para las tres pestañas.

## 5. Fases

- [ ] **Fase 0 — Base.** `pnpm install` para que `expo-notifications` resuelva y el typecheck móvil pase. Ampliar `tokens.json` e `index.ts` de `design-tokens` con claro/oscuro, estados y `tag`.
- [ ] **Fase 1 — Tema y fuentes.** `src/theme/`, `useTheme`, carga de Geist y Geist Mono, tema de React Navigation (`ThemeProvider`) con los colores Trazo, `StatusBar` según el modo. Borrar `constants/theme.ts` y `global.css` al terminar la migración.
- [ ] **Fase 2 — Componentes.** Los de §4, reestilizar `select-field`, `multi-select-field`, `date-field`, `photo-field` y `signature-pad` (trazo en tinta, no en negro puro).
- [ ] **Fase 3 — Marco de la app.** Barra de iconos inferior (`components/icon-tab-bar.tsx`) con `lucide-react-native` (`ClipboardPlus` Solicitar, `CalendarClock` Mis préstamos, `FileWarning` Novedades), indicador animado con Reanimated (150–240 ms, sin rebote, quieto con «reducir movimiento»); se borran `app-tabs.web.tsx` y los iconos `tabIcons/`; splash con la marca SGIA (icono `Boxes` del web) sobre papel/grafito en `animated-icon.tsx` y `app.json`; fondo del icono adaptativo de Android al papel.
- [ ] **Fase 4 — Pantallas.** Login, Solicitar (`index.tsx`: pañol, catálogo, carrito, datos de la solicitud, modal de éxito), Mis préstamos (`explore.tsx`), Novedades (lista, formulario y detalle). Estados de solicitud e informe con `Badge` y los tonos del web.
- [ ] **Fase 5 — Limpieza y verificación.** Borrar archivos de plantilla sin uso. Auditoría por grep: cero hex fuera de `src/theme/`, cero `fontWeight` 700, cero `fontSize` bajo 12, cero `textTransform: 'uppercase'`. `pnpm typecheck` y `pnpm lint` en verde. Capturas en web de Expo a 375 px en claro y oscuro de cada pantalla, contra la API real con el login de PRO-01.
- [ ] **Fase 6 — Cierre.** Sección «Móvil» en `.claude/skills/sgia-design/SKILL.md`, `CLAUDE.md`, `FIXES/CHANGELOG-FIXES.md`, este plan a «implementado».

Un commit por fase verificada.

## 6. Fuera de alcance

- Nuevas funciones o cambios de flujo (las tres pestañas y sus rutas se mantienen; solo cambia cómo se ve el menú).
- Rediseñar el arte del icono de la app (solo cambia el color de fondo del adaptativo y el splash).
- Cambios en la web o en el backend.
- Interruptor de tema dentro de la app.
