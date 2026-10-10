# REQ-CONFIG: Configuración de Sistema y Selección de Paletas Cromáticas

Este fichero de tareas consta de tareas para un apartado específico del sistema como lo es las configuraciones. Tiene como fin incorporar de primera mano ajustes para diferentes paletas de colores a modo de mostrar al usuario final.

> **Regla de oro de ergonomía visual:** DENTRO DE CADA APARTADO DE INGRESES DEBES VERIFICAR SI SE SOLAPA CON OTROS ELEMENTOS. (Verificado: sin solapamiento a ningún ancho de sidebar, ni en estado expandido ni en modo encogido de 48px).

> **Directriz Estricta de Paletas Alternativas (AGENTS.md - Nota L100):**  
> *"Para cada paleta alternativa dentro de las opciones se deben mantener como colores de fondo ya sea el blanco y negro (este puede variar un poco según paleta elegida). Los colores deben verse reflejados en los tonos de botones, letras específicas como estados de entidades entre otros sin perder la estética principal y enfoque de la paleta principal."*

---

## 📋 Lista de Tareas

- [x] **Botón dentro del sidebar al costado del nombre de usuario:**
  - Botón con forma de engranaje (`Settings`) ubicado al costado del perfil del usuario (entre la información del usuario y el botón de logout) en la barra lateral expandida, y en el bloque inferior `IconBar` en modo encogido (`48px`).
  - Al pulsar abre el apartado de ajustes a modo de menú modal (`SettingsModal`) centrado, accesible y con soporte para tecla `Esc` y clic exterior.
  - Verificación anti-solapamiento: `min-w-0 flex-1 truncate` para textos y `shrink-0` para avatar y controles de acción (soporta hasta `180px` de ancho sin colisiones).

- [x] **Ajuste debe tener apartado de paleta de colores:**
  - Sección interactiva *"Paleta de Colores de Interfaz"* con previsualización en vivo, información técnica y muestrario de chips cromáticos (swatches) para cada esquema.
  - Selección instantánea con sincronización reactiva en el DOM (`data-palette`) y persistencia en almacenamiento local (`sgia-palette`).

- [x] **Paleta de colores principal:**
  - Paleta estándar industrial INACAP basada en la escala neutra Zinc (`bg-zinc-100` / `bg-zinc-950`), superficie `bg-white` / `bg-zinc-900`, acento institucional INACAP (`#dc2626`) y estados semánticos técnicos estándar.

- [x] **Paleta de colores B1 de AGENT.md / Design.md:**
  - Paleta alternativa de alta concentración técnica con tonos aeroespaciales e industriales de `SKILLS/Design.md`:
    - `Smart Blue` (`#0466c8`)
    - `Steel Azure` (`#0353a4`)
    - `Regal Navy` (`#023e7d`)
    - `Prussian Blue` (`#002855`, `#001845`, `#001233`)
    - `Twilight Indigo` (`#33415c`)
    - `Blue Slate` (`#5c677d`)
    - `Slate Grey` (`#7d8597`)
    - `Cool Steel` (`#979dac`)
  - Conexión dinámica mediante atributo `data-palette="b1"` y persistencia en `localStorage.getItem('sgia-palette')`.

- [x] **Preservación de fondos neutros (Blanco/Negro) y reflejo en botones, letras y estados (AGENTS.md L100):**
  - **Fondos estructurales:** Se mantiene el blanco y negro/carbón neutro como superficie base (`--bg` claro `#F8FAFC`, oscuro `#0B0F17`; superficies `--surface` `#FFFFFF` y `#121824`) con micro-variación sutil permitida, sin pintar paneles ni canvas con tonos invasivos saturados.
  - **Tonos de botones:** El color de acento B1 (`Smart Blue #0466c8` y `Steel Azure #0353a4`) se aplica en botones de acción principal, botones primarios (`.btn-primary`), rings de foco activo y acentos de confirmación.
  - **Letras y tipografía específica:** Reflejo en indicadores de navegación activos (`nav a.active`, `nav a[aria-current="page"]`), acentos de títulos técnicos y metadatos con `Blue Slate` (`#5c677d`) y `Cool Steel` (`#979dac`).
  - **Estados de entidades:** Badges semánticos y puntos indicadores (`Status Dot`) alineados con la identidad técnica sin perder la claridad de estados operativos (óptimo, en préstamo, alerta, mantención).
  - **Consistencia estética:** Se preserva intacta la identidad técnica de alta densidad, bordes de 1px y legibilidad industrial de la paleta principal.

- [x] **Texto de color de la Sede para cada paleta:**
  - **Paleta Principal:** Micro-etiqueta institucional (`SEDE TEMUCO · PAÑOL TI`, etc.) con texto y borde en Rojo Institucional INACAP (`text-red-700 dark:text-red-400`, `border-red-200 dark:border-red-900/40`, dot `bg-red-500`).
  - **Paleta B1:** Micro-etiqueta institucional de la sede y texto de sede en sidebar (`INACAP Sede Temuco`) adaptados dinámicamente al color Smart Blue (`#0466c8` en modo claro / `#38bdf8` en modo oscuro, con dot en `#0466c8`).

- [x] **Texto de color de "activo" de cada registro en la tabla:**
  - **Paleta Principal:** Badge de estado "activo" en tablas (`inventario-table`, `usuarios-table`) en Verde Esmeralda (`text-emerald-700 dark:text-emerald-300`, `bg-emerald-50 dark:bg-emerald-950/40`).
  - **Paleta B1:** Badge y texto de estado "activo" de cada registro adaptados al tono técnico Smart Blue (`#0466c8` en modo claro / `#38bdf8` en modo oscuro, `bg-blue-50 dark:bg-[#0466c8]/15`, `border-blue-200/80 dark:border-[#0353a4]/50`), con dot indicador sincronizado.
