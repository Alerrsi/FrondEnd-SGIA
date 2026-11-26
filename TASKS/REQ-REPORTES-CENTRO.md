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
- [x] Tests: catálogo por rol, período → fechas, vista previa con filtros, descarga, repetir.
- [ ] Prueba contra la API real con los tres roles (cuando el backend responda `preview=1`, `/reports/period` y `/me/report-downloads`).

Frontend implementado contra el contrato con mocks (FIX-071); falta el backend de las fases 2–5 del plan.
