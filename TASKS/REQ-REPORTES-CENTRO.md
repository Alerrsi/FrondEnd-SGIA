# Centro de reportes `/reportes` con vista previa

Plan y contrato: `BackEnd-SGIA/docs/centro-reportes.md`. Roles: `DIR-01`, `PAN-01`, `AD-01`.

## Tareas
- [ ] Ruta `/reportes` en `ROUTE_PERMISSIONS` y entrada «Reportes» en el menú.
- [ ] Catálogo por rol (`features/reportes/catalog.ts`), agrupado y marcado foto/período.
- [ ] Filtros por reporte y selector de período (año, semestre `2026-1` = ene–jun, mes, rango, últimos 30 días) con las fechas visibles.
- [ ] Vista previa (`preview=1`): pestañas por hoja, formato como en Excel, «Mostrando 20 de N», se actualiza al cambiar filtros.
- [ ] «Descargar Excel» con los mismos parámetros de la vista previa.
- [ ] «Mis descargas» con «Repetir».
- [ ] Filtros del servidor en `/equipos` (`/products/export?type=equipo` con búsqueda, categoría y estado), `/alertas` (`search`) y `/compras/proveedores` (`search`).
- [ ] Tests: catálogo por rol, período → fechas, vista previa con filtros, descarga, repetir.
