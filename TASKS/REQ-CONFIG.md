# REQ-CONFIG: Configuración de Sistema y Selección de Paletas Cromáticas

Este fichero de tareas consta de tareas para un apartado específico del sistema como lo es las configuraciones. Tiene como fin incorporar de primera mano ajustes para diferentes paletas de colores a modo de mostrar al usuario final.

> **Regla de oro de ergonomía visual:** DENTRO DE CADA APARTADO DE INGRESES DEBES VERIFICAR SI SE SOLAPA CON OTROS ELEMENTOS. (Verificado: sin solapamiento a ningún ancho de sidebar, ni en estado expandido ni en modo encogido de 48px).

## 📋 Lista de Tareas

- [x] **Botón dentro del sidebar al costado del nombre de usuario:**
  - Botón con forma de engranaje (`Settings`) ubicado al costado del perfil del usuario (entre la información del usuario y el botón de logout) en la barra lateral expandida, y en el bloque inferior `IconBar` en modo encogido (`48px`).
  - Al pulsar abre el apartado de ajustes a modo de menú modal (`SettingsModal`) centrado, accesible y con soporte para tecla `Esc` y clic exterior.
- [x] **Ajuste debe tener apartado de paleta de colores:**
  - Sección interactiva *"Paleta de Colores de Interfaz"* con previsualización en vivo, información técnica y muestrario de chips cromáticos (swatches) para cada esquema.
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
