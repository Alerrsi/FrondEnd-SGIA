# Avisos emergentes propios (toasts)

**Estado: implementado (noviembre 2026), con el aspecto de sileo (rama `feat/avisos-estilo-sileo`).** Rama `feat/avisos-emergentes`. Solo frontend. Relacionado: `BackEnd-SGIA/docs/exportaciones-y-campana.md` (campana).

## Problema

| Hoy | Problema |
|---|---|
| Los avisos (`toast.success/error/warning/info`, 204 llamadas) los dibuja `sileo`: una «píldora» SVG que se expande al pasar el mouse y se cierra deslizando. | No admite otro color al pasar el mouse, ni un ícono propio, ni cerrar un aviso concreto con clic (sus elementos no exponen el id). |
| El usuario pidió: sonido al aparecer un aviso, al pasar el mouse que se ponga rojo de forma gradual con un basurero y que el clic lo quite. | — |
| En la campana se había agregado ese hover y el clic para ocultar alertas. | El usuario aclaró que eso era para los avisos emergentes, **no** para el menú de la campana. |

## Decisiones (2026-11-23)

| # | Decisión |
|---|---|
| 1 | **Componente propio** (`components/ui/toaster.tsx` + `lib/toast.ts`) en lugar de `sileo`. La API no cambia: `toast.success/error/warning/info(string \| { title, description, duration })`; se suma `toast.dismiss(id)`. Se quita la dependencia `sileo`. |
| 2 | Estilo «Trazo»: superficie con línea de 1 px, radio 8 px, sombra suave (flota sobre el contenido, como el menú), ícono de estado con su tono (`ok`, `danger`, `warn`, `info`), título 14 px y descripción 13 px en tipo oración (sileo pasaba los títulos a «Tipo Título»). Arriba a la derecha; bajo 640 px a ancho completo. Máximo 4 a la vez. |
| 3 | **Sonido** (`lib/notification-sound.ts`, el mismo de la campana) cada vez que aparece un aviso; si salen varios juntos suena una sola vez. Desde el 2026-11-24 es el archivo `src/assets/sounds/notificacion.mp3` que eligió el usuario (antes, dos tonos generados con Web Audio). |
| 4 | **Hover y foco**: el aviso pasa a rojo de forma gradual (fondo `danger-bg`, borde y texto `danger`, 300 ms) y aparece un basurero; el temporizador se pausa mientras el mouse está encima. **Clic, Enter o Espacio** lo quitan. Con `prefers-reduced-motion` sin transición. |
| 5 | Duración: 4 s; los errores 6 s. |
| 6 | Por encima de modales y hojas (`z-index` 100, como sileo). Hacer clic en un aviso con un modal abierto **no** cierra el modal: `Dialog` y `Sheet` ignoran la interacción si viene del contenedor de avisos (`[data-toaster]`). |
| 7 | Accesibilidad: región `aria-live` (`polite`; los errores `assertive`); cada aviso es un botón «Quitar aviso: {título}». |
| 8 | **Campana como antes**: sin hover rojo ni basurero; el clic en una alerta lleva a `/alertas`. Se conserva el sonido cuando llega una alerta de stock nueva (consulta cada 60 s). La campana deja de pedir `exclude_dismissed`. El endpoint `POST /api/alerts/{id}/dismiss` del backend queda sin uso en la web. |

## Fases

1. [x] Plan y documentos (este archivo, `CLAUDE.md`, skill `sgia-design`, `TASKS/REQ-DISEÑO.md`, `TASKS/REQ-06`).
2. [x] Campana como antes (con sonido) y su test.
3. [x] `lib/toast.ts` + `Toaster` propio, sin `sileo`; `Dialog`/`Sheet` ignoran clics en avisos; tests.
4. [x] Prueba en Chromium contra la API real: aviso al marcar un cajón lleno, sonido, transición medida, clic para quitar, con y sin modal abierto, claro/oscuro y 390 px.

## Notas de implementación

- `lib/toast.ts` guarda los avisos en un store simple (`useSyncExternalStore`); `components/ui/toaster.tsx` los dibuja y `toast-card.tsx` es cada aviso. Se quitó `sileo` (dependencia, CSS y su `z-index`).
- Radix difiere el «clic fuera» del modal hasta el `click`, cuando React ya quitó el aviso del DOM: `lib/is-toaster-event.ts` reconoce también el aviso desprendido (`[data-toast]`). Sin esto, quitar un aviso cerraba el modal (lo encontró la prueba en Chromium; el test unitario con happy-dom no).
- El rojo usa `hover:` de Tailwind, que va dentro de `@media (hover: hover)`: en pantallas táctiles no hay hover y el clic igual quita el aviso. El Chromium headless declara que no hay mouse; para medir la transición se lanzó con `--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4`.
- Prueba real (12/12): aviso al marcar un cajón lleno, texto en tipo oración, dos tonos, fondo y basurero medidos a mitad de la transición, pausa con el mouse encima, clic para quitar, con el pop-up del estante abierto (el modal sigue abierto), se va solo a los 4 s, 390 px en oscuro a ancho completo. Los cajones de prueba quedaron sin «lleno».

## Rediseño con el aspecto de sileo (2026-11-23)

El usuario pidió que los avisos se vean como antes con sileo, conservando sonido, rojo al pasar el mouse y clic para quitar.

| # | Decisión |
|---|---|
| 9 | **Píldora** de 40 px de alto, ancho según el contenido y alineada a la derecha, con los colores de sileo: fondo `#1a1a1a` en claro y `#f2f2f2` en oscuro; ícono en un círculo de 24 px con el color del estado al 20 %; título de 13,2 px en el color del estado (los `oklch` de sileo: verde, rojo, amarillo, celeste). |
| 10 | Con descripción, la píldora se abre en una tarjeta del mismo color (radio 20 px) con la descripción debajo, como sileo expandido. |
| 11 | Entrada con el resorte de sileo (opacidad, `translateY(-6px)`, `scale(.95)` y desenfoque del contenido); sin movimiento con `prefers-reduced-motion`. |
| 12 | **Hover y foco**: la píldora pasa a rojo de forma gradual (300 ms), el texto a blanco y el ícono del estado se convierte en un basurero dentro del mismo círculo (sin cambiar el ancho). Clic, Enter o Espacio la quitan. |
| 13 | Los títulos se mantienen en tipo oración (sileo los pasaba a «Tipo Título»; la web no usa ese estilo). |

Verificación: capturas de los cuatro tipos con y sin descripción en claro y oscuro, hover rojo en ambos temas y el recorrido real 12/12 (sonido, transición medida de `#1a1a1a` a rojo, basurero, clic con modal abierto, se va solo, 390 px alineado a la derecha). Ojo: el rojo va con `hover:` sobre el propio botón; `group-hover:` solo aplica a los hijos.

## Fuera de alcance

- Avisos con botón de acción o de tipo «promesa» (nadie los usa).
- Preferencia para silenciar el sonido.

## Sonido elegido por el usuario (2026-11-24)

- `lib/notification-sound.ts` reproduce `src/assets/sounds/notificacion.mp3` («New Notification 010» de Universfield, 1,3 s, 40 KB; licencia de Pixabay: uso libre, sin atribución obligatoria) en lugar de los dos tonos de Web Audio. Lo usan los avisos y las alertas nuevas de la campana.
- Un solo `<audio>` reutilizado a volumen 0,6: si llegan notificaciones seguidas, el sonido vuelve a empezar en vez de apilarse. Si el navegador bloquea el sonido (sin interacción previa), `play()` se rechaza en silencio.
- Vite lo empaqueta con hash (`assets/notificacion-*.mp3`). Prueba real: al marcar un cajón lleno sale el aviso y el audio queda sonando (sin errores); `notification-sound.test.ts` cubre el archivo, el volumen, el reinicio y el bloqueo.

