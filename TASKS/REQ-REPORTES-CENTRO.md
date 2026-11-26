# Centro de reportes `/reportes` con vista previa

Plan y contrato: `BackEnd-SGIA/docs/centro-reportes.md`. Roles: `DIR-01`, `PAN-01`, `AD-01`.

## Tareas
- [x] Ruta `/reportes` en `ROUTE_PERMISSIONS` y entrada «Reportes» en el menú.
- [x] Catálogo por rol (`features/reportes/catalog.ts`), agrupado y marcado foto/período.
- [x] Filtros por reporte y selector de período (año, semestre `2026-1` = ene–jun, mes, rango, últimos 30 días) con las fechas visibles.
- [x] Vista previa (`preview=1`): pestañas por hoja, formato como en Excel, «Mostrando 20 de N», se actualiza al cambiar filtros.
- [x] «Descargar Excel» con los mismos parámetros de la vista previa.
- [x] «Mis descargas» con «Repetir».
- [x] Filtros del servidor en `/equipos` (`/products/export?type=equipo` con búsqueda, categoría y estado), `/alertas` (`search`) y `/compras/proveedores` (`search`).
- [x] Página al alto de la ventana desde 1024 px (como `/ubicaciones`): sin desplazar la página en 1280×632 a 1920×961 con los tres roles; el catálogo y la tabla se desplazan por dentro. Filtros y período en una sola grilla de columnas iguales (mín. 150 px, máx. 5 por fila), período en selectores con sus fechas junto a la etiqueta, «Descargar Excel» junto al título y el conteo de filas en la barra de hojas.
- [x] Tests: catálogo por rol, período → fechas, vista previa con filtros, descarga, repetir.
- [x] Prueba contra la API real con los tres roles (2026-11-26): 26 reportes con vista previa = archivo, `403`/`422`, «Mis descargas» y «Repetir»; detalle en el plan.

Implementado en frontend y backend. La prueba real corrigió las hojas declaradas de «Presupuestos» (`Presupuestos · Movimientos · Resumen`) y del «Informe del período» (`Resumen general · Préstamos · Detalle · Mantenciones · Informes · Alertas · Resumen`).
