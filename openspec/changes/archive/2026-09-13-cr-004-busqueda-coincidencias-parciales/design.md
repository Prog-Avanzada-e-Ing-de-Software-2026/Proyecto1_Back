# Design: CR-004 — Partial-Coincidence Search by Denominación, Línea, and SuperLínea

## Technical Approach

Add a shared, case-insensitive + accent-sensitive containment WHERE fragment to `QueryBuilderHelper`, then expose a thin `busquedaPorCoincidenciaParcial()` per repository (Producto, Línea, SuperLínea). HU-1 upgrades product denominación search; HU-2/HU-3 selection endpoints return a slim `SelectOption` shape; HU-3 adds a new products-by-superlínea join query. No schema/collation change.

## Architecture Decisions

### Decision 1: Component placement — shared helper + thin per-adapter wrapper

| Option | Tradeoff | Decision |
|---|---|---|
| Generic method on `BasePersistenceAdapter` | Max DRY; forces Producto adapter refactor (raw query builders + plain `deletedAt` column) → high blast radius/regression risk | Rejected (deferred) |
| **Static `QueryBuilderHelper.applyPartialCoincidence()` + ~3-line wrapper per adapter** | ~3 lines duplicated per entity; non-trivial SQL centralized in Common | **Chosen** |

Rationale: full centralization requires refactoring `ProductoPersistenceAdapter` (does not extend `BasePersistenceAdapter`; uses raw builders and plain `deletedAt IS NULL`), expanding regression risk for a modest DRY gain. Keep the SQL centralized, duplicate only the wrapper. Full centralization is a deferred follow-up.

### Decision 2: Containment expression

**Choice**: `LOWER(col) COLLATE utf8mb4_bin LIKE CONCAT('%', LOWER(:termino), '%') COLLATE utf8mb4_bin` (collate BOTH sides).

Rationale: deterministic case-insensitive + accent-sensitive matching regardless of column/connection default collation (`utf8mb4_0900_ai_ci`). `LOWER` + `_bin` makes case irrelevant while accents stay distinct.

### Decision 3: No column/table collation change

**Choice**: keep column collations unchanged.

Rationale: protects unique indexes on `linea.denominacion` and `super_linea.denominacion`. Collation is enforced per-query via `COLLATE`, not per-column.

### Decision 4: Slim selection shape

**Choice**: Línea/SuperLínea selection return `SelectOption` (`codigo`/`nombre`/`descripcion`).

Rationale: reuses `common/interface/select-option.ts`; maps `id→codigo`, `denominacion→nombre`, `observacion→descripcion`.

## Data Flow

```
Controller ──→ Service ──→ Repository (facade) ──→ PersistenceAdapter
                                                          │
                                          QueryBuilderHelper.applyPartialCoincidence()
                                                          │
                                                   MySQL (COLLATE utf8mb4_bin LIKE)
```

HU-3 products-by-superlínea: `Producto ──join──→ Línea ──join──→ SuperLínea` (filter `superLinea.id`, all three `deletedAt IS NULL`).

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/modules/common/query-builders/query-builder-helpers.ts` | Modify | Add `applyPartialCoincidence()` static WHERE fragment |
| `.../producto/domain/interfaces/producto.repository-interface.ts` | Modify | Add `busquedaPorCoincidenciaParcial()` + `findProductosBySuperLinea()` |
| `.../producto/infraestructure/repositories/producto.repository.ts` | Modify | Delegate both new methods |
| `.../producto/infraestructure/repositories/producto.persistence-adapters.ts` | Modify | Implement via helper; add join query |
| `.../producto/application/services/producto.service.ts` | Modify | Orchestrate + map to DTO |
| `.../producto/application/controllers/producto.controller.ts` | Modify | New search endpoint(s) |
| `.../linea/domain/interfaces/linea.repository.interface.ts` | Modify | Add `busquedaPorCoincidenciaParcial()` |
| `.../linea/infraestructure/repositories/linea.repository.ts` | Modify | Delegate |
| `.../linea/infraestructure/repositories/linea.persistence-adapter.ts` | Modify | Implement (extends `BasePersistenceAdapter`) |
| `.../linea/application/services/linea.service.ts` + `.../linea/application/controllers/linea.controller.ts` | Modify | Slim selection endpoint |
| `.../linea/mappers/linea.mapper.ts` | Modify | Add `toSelectOption()` |
| `.../superlinea/domain/interfaces/superlinea.repository.interface.ts` | Modify | Add `busquedaPorCoincidenciaParcial()` |
| `.../superlinea/infraestructure/repositories/superlinea.repository.ts` + `.../superlinea.persistence-adapter.ts` | Modify | Delegate + implement |
| `.../superlinea/application/services/superlinea.service.ts` + `.../superlinea/application/controllers/superlinea.controller.ts` | Modify | `select` returns `SelectOption[]` |
| `.../superlinea/mappers/superlinea.mapper.ts` | Modify | Add `toSelectOption()` |

(Paths abbreviated under `src/modules/gestion-productos/`.)

## Interfaces / Contracts

```ts
// QueryBuilderHelper (Common)
static applyPartialCoincidence<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  alias: string, campo: string, termino: string,
): SelectQueryBuilder<T> {
  return query.andWhere(
    `LOWER(${alias}.${campo}) COLLATE utf8mb4_bin
       LIKE CONCAT('%', LOWER(:termino), '%') COLLATE utf8mb4_bin`,
    { termino },
  );
}
```

```ts
// IProductoRepository
busquedaPorCoincidenciaParcial(denominacion, skip, take): Promise<{ data: Producto[]; total: number }>;
findProductosBySuperLinea(superLineaId, skip, take): Promise<{ data: Producto[]; total: number }>;

// ILineaRepository / ISuperLineaRepository
busquedaPorCoincidenciaParcial(denominacion): Promise<SelectOption[]>;
```

Empty/whitespace `denominacion` → short-circuit to empty result, no DB query. `SelectOption` mapping: `codigo=id`, `nombre=denominacion`, `descripcion=observacion ?? ''`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (RED first) | `applyPartialCoincidence` SQL fragment; case-insensitive + accent-sensitive; empty term short-circuit | Jest; mock `SelectQueryBuilder`; assert `andWhere` args |
| Unit | `busquedaPorCoincidenciaParcial` per adapter + mapper `toSelectOption` | `@nestjs/testing`; assert slim shape |
| Integration | Controller/service wiring returns `SelectOption[]` and paginated products | Supertest; assert response shape + 10-per-page |

Strict TDD (RED→GREEN→REFACTOR), `yarn test`. `yarn build` for type checks.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required (no schema/collation change). Rollback is source-only (revert commits).

## Open Questions

- [ ] HU-2 "products of a selected línea" has no delta spec — served by existing `findBy` `lineaId` filter, or out of scope?
- [ ] Expose HU-1 as new `GET /producto/search-by-denominacion` vs. modifying the denominación branch of existing `search-by`?
- [ ] Confirm `SelectOption.descripcion` maps to entity `observacion` (entities expose `observacion`, not `descripcion`).
