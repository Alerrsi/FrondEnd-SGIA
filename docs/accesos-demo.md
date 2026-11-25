# Accesos de demostración por rol

**Estado: implementado (noviembre 2026).** Rama `feat/accesos-demo`. Solo frontend web. Lo pidió el usuario para la presentación: «añade un botón para acceder fácilmente a cada rol con fines de presentar más ágilmente».

## Problema

En la presentación se recorren los cuatro roles (AD-01, DIR-01, PAN-01, PRO-01). Hoy hay que cerrar sesión y escribir correo y contraseña cada vez. Los «Accesos rápidos de prueba» del login solo existen en `vite dev` y solo rellenan el formulario; en el despliegue de AWS (build de producción) no aparecen.

## Decisiones

| # | Decisión |
|---|---|
| 1 | **Login:** los botones de cuenta de prueba **entran directo** con un clic (ya no solo rellenan el formulario). Rótulo «Entrar como (demostración)», un botón por rol con su nombre corto (Administrador, Director, Pañolero, Docente) y su código. |
| 2 | **Dentro de la app:** botón flotante «Cambiar rol» (esquina inferior derecha, discreto, neutro; los avisos van arriba a la derecha) con un menú de los cuatro roles y el actual marcado. Va en `AppLayout`, así sirve igual con el layout de sidebar y el de header. Al elegir, entra con esa cuenta y lleva a Inicio. |
| 3 | **Cuándo se activa:** en `vite dev` con `VITE_DEV_QUICK_LOGIN_PASSWORD` (como hoy) o en un build compilado con `VITE_DEMO_LOGIN_PASSWORD`. Sin ninguna de las dos no se muestra nada y la contraseña no llega al bundle (Vite elimina la rama de `import.meta.env.DEV`). |
| 4 | **Riesgo aceptado:** con `VITE_DEMO_LOGIN_PASSWORD` la contraseña de las cuentas sembradas queda en el JavaScript público. Solo para despliegues de presentación con datos de demostración, nunca en producción real. Lo activa `deploy-aws/sgia-aws.sh` con `SGIA_DEMO=1`. |
| 5 | **Cambio de cuenta sin pasar por «sin sesión»:** `switchAccount` del `AuthProvider` revoca el token actual (`POST /api/logout`), entra con la cuenta nueva (`POST /api/login`), vacía la caché de TanStack Query y fija el usuario nuevo en un solo paso; el layout no se desmonta. Si el login falla, la sesión queda cerrada y el router lleva a `/login`. |
| 6 | Cuentas fijas de `DatabaseSeeder`: `admin@sgia.cl`, `director@sgia.cl`, `panol@sgia.cl`, `docente@sgia.cl`. Sin endpoint nuevo en el backend. |

## Componentes

- `features/auth/lib/demo-accounts.ts`: cuentas y `demoLoginPassword()`.
- `features/auth/context/auth-context.tsx`: `switchAccount(payload)`.
- `features/auth/hooks/use-demo-login.ts`: `enterAs(cuenta)`, cuenta en curso, aviso y navegación a Inicio.
- `features/auth/components/demo-role-switcher.tsx`: botón flotante con menú (Radix `DropdownMenu`).
- `features/auth/pages/login.tsx`: botones que entran directo.
- `vite-env.d.ts` y `apps/web/.env.example`: `VITE_DEMO_LOGIN_PASSWORD`.

## Fases

1. [x] Plan y documentos (este archivo, `CLAUDE.md`, `FIXES/CHANGELOG-FIXES.md`).
2. [x] Implementación con tests (login entra directo, el selector cambia de cuenta, nada visible sin contraseña de demo).
3. [x] Despliegue en AWS con `SGIA_DEMO=1` y prueba real de los cuatro roles.

## Prueba real (2026-11-25)

Chromium headless por CDP contra el despliegue de AWS (`SGIA_DEMO=1`, datos de `RealisticDemoSeeder`), 9/9: el login muestra los cuatro botones; un clic en «Pañolero» entra como PAN-01; el botón flotante muestra el rol actual; los cambios a Director, Administrador, Docente y Pañolero devuelven el rol correcto en `/api/me`, muestran el menú de ese rol, dejan el token anterior en 401 y no pasan por `/login`. «Director de carrera» se cortaba en la grilla del login: se usa «Director».

## Fuera de alcance

- App móvil (el docente usa la web o la app con su login normal).
- Cuentas de demostración configurables desde el backend.
