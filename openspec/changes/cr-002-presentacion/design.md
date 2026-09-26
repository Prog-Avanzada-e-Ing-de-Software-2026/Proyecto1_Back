# Design: Introduce Presentación

## Technical Approach

Add `Presentacion` as a dedicated NestJS module with the repository-token layering already used by `SuperLinea`, `Linea`, and `Marca`. `Producto` gains a required TypeORM many-to-one relation. Application services resolve an active parent before writes, mappers shape public responses, and repository-backed policies coordinate cross-aggregate deletion checks. A staged MySQL migration makes existing data valid before enforcing `NOT NULL`.

## Architecture Decisions

| Decision | Alternatives and tradeoff | Rationale |
|---|---|---|
| Dedicated `presentacion` module | Nesting it in `producto` couples independent lifecycles. | Matches CR-003 aggregate separation and Nest modular boundaries. |
| Resolve associations in `ProductoService` through `IPresentacionRepository` | Accepting an unchecked ID in persistence is simpler but unsafe. | Keeps validation in orchestration and TypeORM access in infrastructure. |
| `ManyToOne` / `OneToMany`, `presentacion_id NOT NULL`, `ON DELETE RESTRICT` | Nullable or cascading relations weaken the mandatory invariant. | Soft deletion remains an application action; FK prevents invalid physical states. |
| Enforce `UNIQUE (denominacion)` including deleted rows | `UNIQUE (denominacion, deletedAt)` permits duplicate `NULL` values in MySQL. | Same rationale as SuperLínea. |
| Leave `utilizaPack` / `cantidadPorPack` untouched | Merging them into Presentación would expand scope and risk regressions. | Conscious technical debt for Entrega 2 / informe. |
| `forwardRef` only at module boundary | Crossing repository ownership to avoid cycles is worse. | Product needs parent lookup; deletion policy needs `existsActiveByPresentacion`. |

## Data Flow

```text
ProductoController -> ProductoService -> IPresentacionRepository (active lookup)
                                     -> IProductoRepository (save with parent)

PresentacionController -> PresentacionService -> deletion policy
                                              -> IProductoRepository (active products only)
                                              -> IPresentacionRepository (soft delete)

Producto query -> join presentacion -> ProductoMapper -> { presentacion: { id, denominacion } }
```

## File Changes

| Path | Action | Responsibility |
|---|---|---|
| `src/modules/gestion-productos/presentacion/domain/{entities,interfaces,services}/` | Create | Entity, repository contract, deletion/creation policies. |
| `src/modules/gestion-productos/presentacion/{application,dto,mappers,infraestructure}/` | Create | CRUD, audit, search, selector, mapping, persistence. |
| `src/modules/gestion-productos/presentacion/presentacion.module.ts` | Create | Wiring. |
| `src/modules/gestion-productos/producto/domain/entities/producto.entity.ts` | Modify | Required `presentacion` relation. |
| `src/modules/gestion-productos/producto/{dto,mappers,application,infraestructure}/` | Modify | Association contract and joins. |
| `src/app.module.ts` | Modify | Register module. |
| `src/migrations/<timestamp>-AddPresentacionToProducto.ts` | Create | Schema, backfill, constraints. |

## Interfaces / Contracts

- `Presentacion`: numeric `id`, required `denominacion`, optional `observacion`, audit fields like `SuperLinea`.
- API under `/presentacion`: create, detail, update, delete, audit, `search-by`, active-only `select`.
- `CreateProductoDto.presentacionId` required integer. `UpdateProductoDto.presentacionId` optional when `undefined`; reject explicit `null`.
- Product responses include `presentacion: { id, denominacion }`.

## Testing Strategy

Strict RED-GREEN-REFACTOR on focused suites: uniqueness including deleted rows, audit, visibility, deletion blocking by active products only, required/update association semantics, joins, reduced mapping. Verify migration `up` on populated and empty `producto` tables, constraints, `down`, and direct MySQL create/reassignment/joined-read behavior; finish with `yarn build`. Global `yarn test` is not an acceptance gate for this CR.

## Migration / Rollout

In one migration transaction: create `presentacion`; insert active `Temporal`; add nullable `producto.presentacion_id`; backfill all products; assert no nulls; set `NOT NULL`; add index and restrictive FK. Deploy schema before relying on application invariants. Roll back code first; then drop FK, column, and table in `down`.

## Open Questions

None for schema foundation. Frontend menu placement to mirror Líneas/SuperLíneas during front slice.
