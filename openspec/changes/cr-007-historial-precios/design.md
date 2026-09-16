# Design: Cambio de Precio e Historial de Precios

## Technical Approach

Extend the existing `producto` module: add the `CambioPrecio` entity and `MotivoCambioPrecio` enum, model `CambioPrecio` as part of the `Producto` aggregate, and route every price write through the aggregate method `cambiarPrecio()`. Persistence stays transactional through the existing `@Transactional()` + UnitOfWork pattern combined with `cascade: ['insert']` on the OneToMany, so saving `Producto` persists the new `CambioPrecio` atomically. History reads originate from the `Producto` aggregate root in the persistence adapter.

## Architecture Decisions

| Decision | Alternatives and tradeoff | Rationale |
|---|---|---|
| `CambioPrecio` as a child of the `Producto` aggregate | Independent entity duplicates aggregate invariants and transaction handling. | Keeps price invariants and persistence boundary inside `Producto`, matching the plan's aggregate guidance. |
| Entity mutates memory only; adapter loads the collection | Injecting a repository into the entity couples domain to infrastructure and defeats DDD boundaries. | `obtenerUltimoCambioPrecio()` operates on the in-memory `cambiosPrecio` collection, loaded by the adapter before a price write. |
| `cascade: ['insert']` + existing `@Transactional()` | Explicit `uow.getRepository(CambioPrecio).save()` duplicates persistence knowledge and can desync the aggregate. | Saving `Producto` in the unit-of-work transaction inserts the new `CambioPrecio`; rollback covers both. |
| `cambiarPrecio()` as the single price mutation point | Direct assignments scattered across mappers/adapters risk silent history gaps. | Enforced by entity tests and by excluding `precio` from the PUT `Object.assign`. |
| Join only on write feeders (`findOne`, `findBy` with `incluirCambiosPrecio`) | Joining every product fetch returns history needlessly and breaks `skip/take` on OneToMany pagination. | Search endpoints keep their payload and pagination; the bulk flow opts in through a repository parameter. |
| String enum stored on the row | Storing an int requires an unmapped lookup to render the API. | `MotivoCambioPrecio` values are the API vocabulary and remain readable in queries and responses. |

## Data Flow

```text
PUT /producto/:id (con precio)
  -> ProductoPersistenceAdapter.update
  -> findOne (leftJoinAndSelect cambiosPrecio)
  -> Producto.cambiarPrecio(precio, ActualizacionDePrecioDirecta)  // solo si precio !== producto.precio
  -> repo.save(producto)   // cascade insert del CambioPrecio, misma transacción

POST /producto/actualizar-precios
  -> ProductoService.actualizarPrecios
  -> findBy(..., incluirCambiosPrecio = true)
  -> Producto.aumentar/disminuirPrecioPor...(valor, motivo)
  -> actualizarPrecioManteniendoMargen(nuevoPrecio, motivo)
  -> cambiarPrecio(nuevoPrecio, motivo)   // motivo: Global o PorLinea segun lineaId
  -> repo.save(producto, ...)             // @Transactional + cascade

GET /producto/:id/historial-precios
  -> ProductoController -> ProductoService.getHistorialPrecios
  -> IProductoRepository.findHistorialPrecios(id, skip, take)
  -> ProductoPersistenceAdapter (leftJoinAndSelect, ORDER BY fecha DESC, id DESC)
  -> CambioPrecioMapper.toDto -> CambioPrecioDto[]
```

## File Changes

| Path | Action | Responsibility |
|---|---|---|
| `src/modules/gestion-productos/producto/enums/motivo-cambio-precio.enum.ts` | Create | `MotivoCambioPrecio` values. |
| `src/modules/gestion-productos/producto/domain/entities/cambio-precio.entity.ts` | Create | Monetary columns, `fecha`, `motivo`, and product relation. |
| `src/modules/gestion-productos/producto/domain/entities/producto.entity.ts` | Modify | `cambiosPrecio` OneToMany, `cambiarPrecio()`, `obtenerUltimoCambioPrecio()`, and motivo-aware margin methods. |
| `src/modules/gestion-productos/producto/domain/interfaces/producto.repository-interface.ts` | Modify | `findHistorialPrecios` and `incluirCambiosPrecio` in `findBy`. |
| `src/modules/gestion-productos/producto/infraestructure/repositories/producto.repository.ts` | Modify | Delegate new history query and flag. |
| `src/modules/gestion-productos/producto/infraestructure/repositories/producto.persistence-adapters.ts` | Modify | History query, joined `findOne`, flagged `findBy`, and PUT `cambiarPrecio` wiring. |
| `src/modules/gestion-productos/producto/application/services/producto.service.ts` | Modify | Global/line motive selection and history orchestration. |
| `src/modules/gestion-productos/producto/application/controllers/producto.controller.ts` | Modify | `GET :id/historial-precios` with typed `Promise<CambioPrecioDto[]>`. |
| `src/modules/gestion-productos/producto/dto/cambio-precio.dto.ts` | Create | History response contract. |
| `src/modules/gestion-productos/producto/mappers/cambio-precio.mapper.ts` | Create | `CambioPrecio` to DTO mapping. |
| `src/migrations/<timestamp>-AddCambioPrecioToProducto.ts` | Create | Reversible table, indexes, and FK. |
| `src/modules/gestion-productos/producto/**/*.spec.ts`, `src/migrations/add-cambio-precio-to-producto.spec.ts` | Create/Modify | Focused tests for all scenarios. |

## Interfaces / Contracts

- `CambioPrecio`: generated numeric `id`, required `producto` relation, `precioAnterior`/`precioNuevo` as `MonetarioColumn()` (decimal 15,5), required `fecha` timestamp (with time), required `motivo`.
- `Producto.cambiarPrecio(precioNuevo, motivo)`: throws when `motivo` is missing or the price is not finite/positive or continuity fails; records `precioAnterior = precio` before updating; `fecha = new Date()`.
- `ProductoPersistenceAdapter.update`: calls `cambiarPrecio` only when the DTO `precio` differs from the current `Producto.precio`, so an unchanged price records nothing.
- `Producto.obtenerUltimoCambioPrecio()`: returns the recorded change with the greatest `fecha` strictly before now, or `undefined`.
- `findBy(..., incluirCambiosPrecio: boolean = false)` and `findHistorialPrecios(id, skip, take): Promise<CambioPrecio[]>`.
- `CambioPrecioDto`: `fecha`, `precioAnterior`, `precioNuevo`, `motivo`.
- `GET /producto/:id/historial-precios` with `PaginationDto` (`skip`, `take`) returns `CambioPrecioDto[]`.

## Testing Strategy

Strict RED-GREEN-REFACTOR on focused suites: entity invariants, continuity rejection, first-change behavior, motive-aware margin methods, bulk global/line routing, PUT persistence path, history ordering/pagination/empty/404, and unchanged search pagination. Migration spec exercises `up`/`down` and FK/index presence against a disposable database. Close with `yarn build`. Global `yarn test` and test-infrastructure repair are not CR-007 acceptance gates.

## Threat Matrix

N/A — no routing engine, shell, subprocess, VCS/PR automation, executable classification, or process-integration boundary is introduced.

## Migration / Rollout

Create `cambio_precio`, index `producto_id` and `fecha`, and a `FK_cambio_precio_producto` referencing `producto(id)` with `ON DELETE CASCADE` so a soft-deleted (or hard-deleted) product releases its history. Deploy schema before code; roll back code first, then drop FK, indexes, and table.

## Open Questions

None.

## Known Technical Debt

- `Producto.precio = margen + costo` remains a convenience invariant driven by the DTO/entity spread; it is not a strict domain invariant with its own tests, and can be violated independently of a recorded `CambioPrecio`. It was pre-existing and is out of CR-007 scope.
- The PUT write feeder is orchestrated inside `ProductoPersistenceAdapter.update`: the adapter decides which DTO fields feed domain mutations and applies the "record only when the price differs" rule when calling `cambiarPrecio`. That is application/domain semantics living in infrastructure (the same pre-existing pattern used for the whole create/update flow) and duplicated venture points; a future refactor could migrate the update orchestration to an application service. Out of CR-007 scope.