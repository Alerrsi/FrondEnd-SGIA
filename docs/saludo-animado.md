# Saludo de Inicio con el nombre escrito a máquina

**Estado: implementado (noviembre 2026).** Rama `feat/saludo-animado`. Solo frontend (web y app móvil). Lo pidió el usuario: «en las pantallas de inicio el nombre del usuario debe quedar con animación, de esas donde se escribe y se vuelve a escribir con el marcador de posición abajo».

## Decisiones

| # | Decisión |
|---|---|
| 1 | En «Hola, {nombre}» solo se anima el **nombre**: se escribe letra por letra (≈ 90 ms), queda quieto 2,8 s, se borra (≈ 45 ms por letra), espera 0,5 s y vuelve a escribirse, en bucle. «Hola,» queda fijo. |
| 2 | **Cursor:** un guion bajo burdeo (`bg-accent` en web, `theme.accent` en móvil) pegado a la línea base, justo después de la última letra. Fijo mientras escribe o borra; parpadea (paso, sin fundido, ~1 s) mientras el nombre está completo. |
| 3 | **Sin saltos de diseño:** en la web el nombre completo ocupa su lugar invisible y el texto escrito va encima (misma celda de grilla), así el título no cambia de ancho ni de alto. |
| 4 | **Accesibilidad:** el texto que cambia y el cursor van `aria-hidden`; el título expone el nombre completo una sola vez (texto solo para lector de pantalla en web, `accessibilityLabel` en móvil). |
| 5 | **Movimiento reducido** (`prefers-reduced-motion` en web, `useReducedMotion` de Reanimated en móvil): nombre completo fijo, sin cursor. |
| 6 | En la web la animación se detiene con la pestaña oculta (`visibilitychange`) y sigue al volver. Sin librerías nuevas: temporizadores y una clase CSS (`ui-caret`). |
| 7 | Excepción documentada en la regla de movimiento del sistema «Trazo» (`.claude/skills/sgia-design/SKILL.md`): el cursor del saludo es la única animación continua permitida. |

## Componentes

- Pasos y tiempos (función pura): `packages/design-tokens/src/typewriter.ts`, compartida por las dos apps.
- Web: `features/inicio/hooks/use-typewriter.ts`, `features/inicio/components/typewriter-name.tsx`; `HomeHero` lo usa. `index.css`: `@keyframes ui-caret` y `.ui-caret`.
- Móvil: `src/features/inicio/hooks/use-typewriter.ts` y `components/typewriter-name.tsx`; el `HomeHero` móvil lo usa. Lo que falta por escribir se dibuja transparente (reserva el ancho); el cursor es el carácter «_» en `theme.accent`; el texto animado va `aria-hidden` y el saludo lleva `accessibilityLabel`.

## Prueba real (2026-11-24)

- Web (PAN-01, DIR-01 en oscuro, AD-01, PRO-01): secuencia medida letra por letra («Pañolero», «Director», «Administrador», «Docente»), borrado y nueva escritura; el nombre ocupa siempre el mismo recuadro (141 × 40 px con «Pañolero» durante 6 s y 9 estados); cursor burdeo de 2,9 px (rosa en oscuro); árbol de accesibilidad «Hola, {nombre}»; parpadeo medido (opacidad 1 y 0); con `prefers-reduced-motion` el nombre queda completo y sin cursor; 390 px sin desplazamiento lateral. 22/23 a la primera: el fallo era la medida del `<h1>` (ancho de columna que cambió al cargar la página), no del nombre.
- Móvil (Expo web, PRO-01): misma secuencia con «Docente», saludo de 358 × 32 px fijo, cursor «_» burdeo que parpadea, `aria-label` «Hola, Docente» con el texto animado oculto, y con «Reducir movimiento» el nombre fijo (7/7). `importantForAccessibility` no oculta en la web de Expo: se usa `aria-hidden`.

## Fases

1. [x] Plan y documentos (este archivo, `CLAUDE.md`, skill `sgia-design`, `TASKS/REQ-DISEÑO.md`).
2. [x] Web: lógica pura + hook + componente, tests con temporizadores falsos.
3. [x] Móvil: hook + componente en el `HomeHero`.
4. [x] Prueba en Chromium (web con PAN-01, DIR-01 y PRO-01; móvil en Expo web): secuencia de escritura medida, título sin cambio de tamaño, lector de pantalla y movimiento reducido.
