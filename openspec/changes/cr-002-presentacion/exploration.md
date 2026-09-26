## Exploration: CR-002 Presentación

### Current State

`Producto` is an independent TypeORM entity and NestJS module with soft deletion (plain `deletedAt` column, not `@DeleteDateColumn`), audit users, and required associations to `Marca` and `Linea`. It has no `Presentacion` concept. Existing fields `utilizaPack` and `cantidadPorPack` encode pack-related commercial detail but are not a reusable catalog of presentations.

The frontend already contains commented scaffolding (`interfaces-presentacion.tsx`, `presentacion-selector.tsx`, commented `presentacionId` in product validation), which suggests the original distributor codebase had Presentación and this CR restores it into the academic domain model.

`SuperLinea` (CR-003) is the closest pattern: dedicated module, unique denomination including soft-deleted rows, staged migration with provisional `Temporal`, required FK with `ON DELETE RESTRICT`, and repository-backed deletion policy.

### Affected Areas

- `src/modules/gestion-productos/presentacion/` — new aggregate module.
- `src/modules/gestion-productos/producto/domain/entities/producto.entity.ts` — required many-to-one association.
- `src/modules/gestion-productos/producto/{dto,mappers,application,infraestructure}/` — write contract, active-parent resolution, joined reads, reduced mapping.
- `src/app.module.ts` — register the new NestJS module.
- `src/migrations/` — create `presentacion`, backfill `producto.presentacion_id`, enforce constraints.
- Frontend (separate repo) — reactivate Presentación ABMC and product selector (later slice).

### Approaches

1. **Separate aggregate module with explicit relation** (recommended) — peer of `Marca`/`Linea`/`SuperLinea`.
2. **Value Object / free-text field on Producto** — rejects ABMC and reuse across products; contradicts CR wording and CR-005 composition.
3. **Reuse `utilizaPack`** — insufficient; cannot represent `1L`, `500ml`, etc. as catalog entries.

### Recommendation

Use a dedicated `presentacion` module mirroring `superlinea`. Model `Producto -> Presentacion` as required many-to-one. Soft-delete + audit like `SuperLinea`. Uniqueness on `denominacion` alone (not composite with `deletedAt`). Staged migration with provisional `Temporal`. Leave `utilizaPack`/`cantidadPorPack` untouched and document the overlap as technical debt.

### Confirmed Decisions

- Provisional backfill denomination: `Temporal`.
- Presentación is Entity / Aggregate Root, not Value Object.
- Deletion blocked only by **active** products.
- Update semantics: omitted `presentacionId` preserves association; explicit `null` rejected.
- CR-005 is out of scope for this change.
