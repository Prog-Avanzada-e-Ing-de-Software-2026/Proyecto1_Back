# Tasks: Cambio de Precio e Historial de Precios

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 450–650 |
| Delivery strategy | stage-by-stage with user review |
| Tested work accumulates into `CR-007`; no partial work merges to `develop` |

## Phase 1: Schema and Domain Behavior

- [ ] 1.1 **RED:** Extend `src/modules/gestion-productos/producto/domain/entities/producto.entity.spec.ts` and add `src/modules/gestion-productos/producto/domain/entities/cambio-precio.entity.spec.ts` covering: positive/finite price requirement, missing motive rejection, `precioAnterior` snapshot, continuity rejection, first change without history, elapsed `fecha`, media collection entry, and single mutation point.
- [ ] 1.2 **GREEN:** Create `src/modules/gestion-productos/producto/enums/motivo-cambio-precio.enum.ts` and `src/modules/gestion-productos/producto/domain/entities/cambio-precio.entity.ts`; add `cambiosPrecio`, `cambiarPrecio()`, and `obtenerUltimoCambioPrecio()` to `producto.entity.ts`.
- [ ] 1.3 **MIGRATION:** Create `src/migrations/add-cambio-precio-to-producto.spec.ts` (empty/populated table, reverse order, FK and indexes) and `src/migrations/<timestamp>-AddCambioPrecioToProducto.ts` with symmetric `down`.
- [ ] 1.4 **REFACTOR:** Name indexes/constraints clearly, rerun entity specs and migration spec, and run `yarn build`.

## Phase 2: Route Price Mutations and Load History on Write Feeders

- [ ] 2.1 **RED:** Extend `producto.entity.spec.ts` for motive-aware margin methods and `producto.service.masivo.spec.ts` for global (no line) and per-line motive selection.
- [ ] 2.2 **GREEN:** Update margin methods to accept and forward `motivo`; select `ActualizacionDePrecioGlobal` / `ActualizacionDePrecioPorLinea` in `ProductoService.actualizarPrecios`.
- [ ] 2.3 **RED:** Extend product persistence/service specs: PUT with `precio` records `ActualizacionDePrecioDirecta` before save and excludes the raw price from the entity merge; regular search does not load changes.
- [ ] 2.4 **GREEN:** Add `leftJoinAndSelect('producto.cambiosPrecio', ...)` to `findOne`; add `incluirCambiosPrecio` flag to `findBy` (interface, repository, adapter); wire the PUT call to `cambiarPrecio()` in `update()`.
- [ ] 2.5 **REFACTOR:** Rerun focused suites plus `yarn build`; record the `precio = margen + costo` debt in the change notes.

## Phase 3: Paginated Price History Endpoint

- [ ] 3.1 **RED:** Extend `producto.service.spec.ts` and `producto.controller.spec.ts`: reverse chronological order, page application, empty history, and unknown-product 404; assert the controller returns `Promise<CambioPrecioDto[]>`.
- [ ] 3.2 **GREEN:** Create `dto/cambio-precio.dto.ts` and `mappers/cambio-precio.mapper.ts`; add `findHistorialPrecios` to interface, repository, and adapter; add `ProductoService.getHistorialPrecios` and the `GET :id/historial-precios` controller handler.
- [ ] 3.3 **REFACTOR:** Rerun focused suites, `yarn build`, and the touched-module regression specs.