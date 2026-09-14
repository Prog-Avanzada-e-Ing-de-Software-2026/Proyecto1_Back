# Proposal: Cambio de Precio e Historial de Precios

## Intent

Record every price change as a `CambioPrecio` inside the `Producto` aggregate and expose a paginated price-history endpoint, routing all price mutations through a single domain method to guarantee a consistent, auditable price trail.

## Scope

### In Scope

- Add a `CambioPrecio` entity (`precioAnterior`, `precioNuevo`, `fecha` with time, and `motivo`) related to `Producto` as part of its aggregate.
- Add the `MotivoCambioPrecio` enum with `ActualizacionDeCosto`, `ActualizacionDeMargen`, `ActualizacionDePrecioPorLinea`, `ActualizacionDePrecioGlobal`, and `ActualizacionDePrecioDirecta`.
- Implement `Producto.cambiarPrecio(precioNuevo, motivo)`, `Producto.obtenerUltimoCambioPrecio()`, and route `actualizarPrecioManteniendoMargen()` through `cambiarPrecio()`.
- PUT product with `precio` calls `cambiarPrecio()` with `ActualizacionDePrecioDirecta` before persisting.
- Bulk price adjustment passes `ActualizacionDePrecioGlobal` (no line) or `ActualizacionDePrecioPorLinea` (line scoped).
- Load `cambiosPrecio` only where the aggregate feeds a price write (`findOne` for PUT, `findBy` with `incluirCambiosPrecio` for bulk) to keep search pagination and read paths unchanged.
- Expose `GET /producto/:id/historial-precios` returning paginated `CambioPrecioDto[]` in reverse chronological order.
- Generate one TypeORM migration for the `cambio_precio` table.

### Out of Scope

- Persisting who made the change (no responsible-user audit on `CambioPrecio`).
- Revisiting the price business rule `precio = margen + costo`; the PUT keeps current semantics and records the mismatch as debt.
- Returning `cambiosPrecio` inside existing product DTOs; `ProductoMapper` remains unchanged.
- Domain events, CQRS read models, and `MovimientoStock`.

## Capabilities

### New Capabilities

- `price-change-history`: `CambioPrecio` recording, `cambiarPrecio()` invariants, routed writes, and the paginated history endpoint.

### Modified Capabilities

None; `openspec/specs/` contains no existing capability specifications.

## Approach

Add the entity and enum under the existing `producto` module, persist atomic writes through the existing `@Transactional()` + UnitOfWork decorators plus `cascade: ['insert']`, load the collection only on write feeders, and implement the history query from the `Producto` aggregate root. Ship the schema first via a hand-written reversible migration, then behavior, then the API.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/modules/gestion-productos/producto/domain/entities/` | Modify | `cambiosPrecio` relation and price-change domain methods |
| `src/modules/gestion-productos/producto/enums/` | New | `MotivoCambioPrecio` |
| `src/modules/gestion-productos/producto/{domain/interfaces,infraestructure/repositories,application/services,application/controllers}/` | Modify | History query, write feeders, service, and endpoint |
| `src/modules/gestion-productos/producto/{dto,mappers}/` | New | `CambioPrecioDto` and `CambioPrecioMapper` |
| `src/migrations/` | New | Reversible `cambio_precio` table migration |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Inconsistent history when the last recorded price differs from the current one | Low | `cambiarPrecio()` rejects the change when consistency cannot be proven |
| Joined OneToMany breaks pagination on search endpoints | Medium | Join only on write feeders; bulk uses an explicit `incluirCambiosPrecio` flag |
| Unrouted price writes pollute history | Medium | Single mutation point plus entity-level tests guarding direct assignments |

## Rollback Plan

Revert endpoint, service, and repository wiring, then run the down migration dropping `cambio_precio` after confirming no history must be preserved.

## Dependencies

None.

## Success Criteria

- [ ] Every price mutation (PUT, bulk global/line, margin adjustments) produces exactly one consistent `CambioPrecio`.
- [ ] `obtenerUltimoCambioPrecio()` proves `precioNuevo` continuity or rejects the change.
- [ ] The history endpoint returns reverse-chronological, paginated DTOs and an empty array when no changes exist.
- [ ] `yarn build` and focused tests pass under strict TDD; the migration applies and reverts cleanly.