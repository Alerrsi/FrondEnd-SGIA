# REQ-22 · Prompt de modificación para la API (`BackEnd-SGIA`, Laravel)

> Para pegar en el repositorio del backend. Complementa [REQ-22](./REQ-22-MAPA-SALAS.md) y el plan [`docs/mapa-salas.md`](../docs/mapa-salas.md).
> Decisiones tomadas: **Estante** es una entidad nueva entre Sala y Cajón; las **Zonas** son entidad propia; `PAN-01` y `DIR-01` editan, el resto de los roles autenticados lee.

---

## Prompt

```text
Contexto
Eres un desarrollador del backend de SGIA (Laravel, API REST bajo /api, auth con Sanctum).
Hoy la ubicación física es Sala (`locations`) → Cajón (`cajones`). El frontend web va a dibujar
un plano por sala (SVG) con zonas y estantes que el pañolero arrastra. Necesitamos dos entidades
nuevas (zonas y estantes), medidas en la sala y la relación cajón → estante.

Antes de escribir código, lee LocationController, CajonController, los modelos Location y Cajon,
LocationResource, CajonResource, sus FormRequest, routes/api.php (bloque REQ-05) y los tests
LocationAndCajonCrudTest y LocationCodeTest. Respeta las convenciones existentes: 422 con
`message` + `errors` en español, `created_by`/`updated_by` automáticos, middleware
`role:DIR-01,PAN-01` para escritura, lecturas con `auth`.

Unidades: todas las medidas y posiciones son ENTEROS en centímetros. El origen (0,0) es la
esquina superior izquierda de la sala; `x` crece a la derecha e `y` hacia abajo. `width` es el
largo del mueble y `depth` su fondo, ambos medidos SIN rotar. Con `rotation = 90` el rectángulo
ocupado es (x, y, depth, width): se intercambian ancho y fondo, y (x, y) sigue siendo la esquina
superior izquierda de lo ocupado.

1. Migraciones
   a) locations: `map_width_cm` (unsignedInteger, nullable) y `map_height_cm` (unsignedInteger,
      nullable).
   b) zonas: id, location_id (FK locations, cascadeOnDelete), nombre (string 60),
      x, y, width, depth (unsignedInteger), created_by, updated_by (FK users nullable,
      nullOnDelete), timestamps. unique(location_id, nombre).
   c) estantes: id, location_id (FK locations, cascadeOnDelete), zona_id (FK zonas, nullable,
      nullOnDelete), codigo (string 12), nombre (string 80, nullable), descripcion (text,
      nullable), x, y, width, depth (unsignedInteger), rotation (unsignedSmallInteger, default 0),
      created_by, updated_by, timestamps. unique(location_id, codigo).
   d) cajones: estante_id (FK estantes, nullable, nullOnDelete).

2. Reglas de dominio
   - Medidas de sala: si map_width_cm/map_height_cm son null, las lecturas del mapa usan
     1000 × 600 y devuelven `has_dimensions: false`.
   - codigo del estante: se normaliza igual que el del cajón (sin tildes, mayúsculas, lo que no
     sea [A-Z0-9] pasa a `-`); 1 a 12 caracteres; único por sala. Mensaje:
     «Ya existe un estante con el código {CODIGO} en esta sala.»
   - width y depth del estante: 20 a 2000. De la zona: 50 a 10000. rotation: 0 o 90.
   - Límites: el rectángulo ocupado (con rotación) debe quedar dentro de la sala
     (x >= 0, y >= 0, x + ancho <= map_width_cm, y + alto <= map_height_cm).
     422 en `x`: «El estante queda fuera de la sala.» (zonas: «La zona queda fuera de la sala.»)
   - Superposición: un estante no puede intersectar a otro estante de la misma sala. Bordes que
     se tocan NO cuentan como superposición. 422 en `x`: «Se superpone con el estante {CODIGO}.»
     Las zonas pueden superponerse entre sí y contener estantes.
   - zona_id del estante debe ser una zona de la misma sala (422 en `zona_id`).
   - cajones.estante_id debe ser un estante de la misma sala que el cajón (422 en `estante_id`:
     «El estante no pertenece a la sala del cajón.»). Si un cajón cambia de location_id y no se
     envía estante_id, su estante_id queda en null.
   - El `barcode` del cajón NO cambia: sigue siendo {code de la sala}-{codigo del cajón}.
   - Achicar una sala (PATCH locations con medidas) que deja un estante o una zona afuera:
     422 en `map_width_cm` o `map_height_cm` con «El estante {CODIGO} quedaría fuera de la sala.»
     Medidas válidas: 100 a 10000.

3. Endpoints (bloque REQ-05/REQ-22 de routes/api.php)

   GET /api/locations/{id}/map (auth)
   {
     "data": {
       "location": { "id", "code", "nombre", "tipo", "map_width_cm", "map_height_cm",
                     "has_dimensions" },
       "zonas": [ { "id", "location_id", "nombre", "x", "y", "width", "depth" } ],
       "estantes": [ { "id", "location_id", "zona_id", "codigo", "nombre", "descripcion",
                       "x", "y", "width", "depth", "rotation",
                       "cajones": [ { "id", "codigo", "barcode", "products_count",
                                      "units_count" } ],
                       "items_count", "has_critical_stock" } ],
       "cajones_sin_estante_count": 0
     }
   }
   - Una sola consulta por colección (eager loading + withCount), sin N+1.
   - items_count = productos con cajon_id en el estante + unidades de equipo en sus cajones
     (excluye unidades dado_de_baja).
   - has_critical_stock = algún insumo del estante con stock <= stock_minimo.
   - Cajones del estante ordenados por codigo.

   PATCH /api/locations/{id} (DIR-01, PAN-01): acepta además map_width_cm y map_height_cm.
   LocationResource agrega ambos campos.

   GET    /api/estantes?location_id=&search=  (auth)        lista paginada, per_page hasta 200
   GET    /api/estantes/{id}                  (auth)        con cajones resumidos
   POST   /api/estantes                       (DIR-01, PAN-01)
          Body: location_id, codigo, nombre?, descripcion?, zona_id?, width, depth, rotation?,
          x?, y?. Si no vienen x e y, ubicar el estante en el primer hueco libre recorriendo
          una rejilla de 10 cm de arriba abajo y de izquierda a derecha (dentro de la zona si
          viene zona_id; si la zona no tiene hueco, en la sala). Sin hueco: 422 en `x`
          «No hay espacio libre en la sala para un estante de esas medidas.» 201.
   PATCH  /api/estantes/{id}                  (DIR-01, PAN-01)
          Parcial: codigo, nombre, descripcion, zona_id, width, depth, rotation, x, y.
          location_id NO se puede cambiar (422). Validar límites y superposición con los
          valores resultantes. Respuesta: el estante como en /map.
   DELETE /api/estantes/{id}                  (DIR-01, PAN-01)
          422 con `cajones_count` si tiene cajones: «El estante tiene {n} cajones; muévelos
          antes de eliminarlo.»
   GET    /api/estantes/{id}/contents         (auth)
   {
     "data": {
       "estante": { ...como en /map },
       "zona": { "id", "nombre" } | null,
       "location": { "id", "code", "nombre" },
       "cajones": [ {
         "id", "codigo", "barcode", "descripcion",
         "productos": [ { "id", "name", "type", "barcode", "quantity", "stock_minimo",
                          "is_critical" } ],
         "unidades": [ { "product_id", "product_name", "type", "total",
                         "by_status": { "disponible": 0, "prestado": 0,
                                        "en_reparacion": 0, "en_mantencion": 0 } } ]
       } ]
     }
   }
   - productos: insumos con cajon_id en ese cajón, ordenados por name.
   - unidades: unidades de equipo/maqueta en ese cajón agrupadas por producto, sin dado_de_baja.
   - Usar los estados de unidad que ya existen en el modelo (ajustar las claves de by_status).

   GET    /api/zonas?location_id=             (auth)
   POST   /api/zonas                          (DIR-01, PAN-01)  location_id, nombre, x, y, width, depth
   PATCH  /api/zonas/{id}                     (DIR-01, PAN-01)  parcial; location_id inmutable
   DELETE /api/zonas/{id}                     (DIR-01, PAN-01)  sus estantes quedan con zona_id null

   PATCH /api/cajones/{id} y POST /api/cajones: aceptan estante_id (nullable).
   CajonResource agrega estante_id y, si está cargado, estante { id, codigo }.

4. Pañol
   - PAN-01 solo puede escribir zonas y estantes de salas de su pañol (users.storeroom_id, o el
     pañol por defecto), igual que el resto de las operaciones por pañol: 403 si no.

5. Tests (Feature)
   - CRUD de estantes y zonas con roles: AD-01 y PRO-01 leen pero reciben 403 al escribir.
   - Límites, superposición (incluido rotation 90 y bordes que se tocan), zona de otra sala.
   - Primer hueco libre y 422 sin espacio.
   - Achicar sala con estante afuera → 422.
   - /map sin N+1 (assert de cantidad de consultas) y con has_dimensions false por defecto.
   - /contents agrupa unidades por producto y excluye dado_de_baja.
   - cajón con estante de otra sala → 422; cambio de sala limpia estante_id.
   - barcode del cajón no cambia al asignarle estante.

6. Documentación
   - Actualizar docs del backend y avisar al frontend para pasar a ✅ las filas de REQ-22 en
     FrondEnd-SGIA/ENDPOINTS.md (sección 2.2).
```
