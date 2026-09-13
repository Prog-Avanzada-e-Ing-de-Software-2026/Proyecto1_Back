# Proposal: CR-004 — Partial-Coincidence Search by Denominación, Línea, and SuperLínea

## Intent

Search productos, líneas, and superlíneas by denominación using substring containment, case-insensitive but accent-sensitive, returning only active (non-soft-deleted) entities with 10-per-page pagination. Current search is accent-insensitive under the DB default `utf8mb4_0900_ai_ci`, violating CR-004.

## Scope

### In Scope
- Shared containment WHERE fragment in `common` (`QueryBuilderHelper.applyPartialCoincidence()`).
- Thin `busquedaPorCoincidenciaParcial()` per repository/adapters (Producto, Línea, SuperLínea).
- HU-1: product search by denominación (upgrade existing endpoint).
- HU-2: línea selection search + products of a selected línea.
- HU-3: superlínea selection search + NEW products-by-superlínea query (Producto→Línea→SuperLínea join).

### Out of Scope
- "Press Enter to search" (frontend concern).
- Column/table collation changes (protect unique indexes on `linea.denominacion` / `super_linea.denominacion`).
- Refactoring the Producto adapter to extend `BasePersistenceAdapter`.

## Capabilities

### New Capabilities
- `partial-coincidence-search`: shared case-insensitive, accent-sensitive containment matcher.
- `product-search-by-denominacion`: search active products by denominación (HU-1), paginated 10.
- `linea-search-selection`: search active líneas by denominación, slim `SelectOption` (HU-2).
- `superlinea-search-selection`: search active superlíneas by denominación, slim `SelectOption` (HU-3).
- `product-search-by-superlinea`: list active products of a selected superlínea via join, paginated (HU-3).

### Modified Capabilities
- None — `openspec/specs/` has no archived capabilities; all are new.

## Approach

Containment: `LOWER(col) COLLATE utf8mb4_bin LIKE CONCAT('%', LOWER(:term), '%') COLLATE utf8mb4_bin` (collate both sides). Add `QueryBuilderHelper.applyPartialCoincidence()`; each adapter exposes `busquedaPorCoincidenciaParcial()` calling it. Selection endpoints return the existing `SelectOption` (`codigo`/`nombre`/`descripcion`).

**Architecture decision — accepted DRY tradeoff.** The shared logic lives as a static helper (`QueryBuilderHelper.applyPartialCoincidence()`) with a thin `busquedaPorCoincidenciaParcial()` wrapper per adapter, rather than a generic method on `BasePersistenceAdapter`. This is deliberately "less DRY": the cost is a ~3-line wrapper per entity, while the non-trivial SQL stays centralized in Common. The benefit is NOT refactoring the Producto adapter (raw query builders + plain `deletedAt` column), keeping blast radius and regression risk low. Full centralization (generic base method + Producto adapter refactor) is deferred as a follow-up.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/modules/common/query-builders/query-builder-helpers.ts` | Modified | Add `applyPartialCoincidence()` WHERE fragment |
| `.../producto/domain/interfaces/producto.repository-interface.ts` + `.../infraestructure/repositories/producto.repository.ts` + `producto.persistence-adapters.ts` | Modified | Thin `busquedaPorCoincidenciaParcial()` |
| `.../linea/domain/interfaces/linea.repository.interface.ts` + `.../infraestructure/repositories/linea.repository.ts` + `linea.persistence-adapter.ts` | Modified | Thin method + slim selection |
| `.../superlinea/domain/interfaces/superlinea.repository.interface.ts` + `.../infraestructure/repositories/superlinea.repository.ts` + `superlinea.persistence-adapter.ts` | Modified | Thin method + slim selection |
| `.../producto/application/controllers/producto.controller.ts` + `.../producto.service.ts` | Modified | Search + products-by-superlínea endpoint |
| `.../linea/application/controllers/linea.controller.ts` + `.../superlinea/application/controllers/superlinea.controller.ts` | Modified | Slim selection endpoints |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Containment `LIKE '%…%'` is non-sargable | High | Accept non-indexed scan; apply pagination after filter |
| Live DB collation differs from assumed default | Low | Explicit `COLLATE utf8mb4_bin` both sides; tests assert accent behavior |
| Existing `findBy`/`findAllFor` consumers regress | Med | Add new behavior; do not replace existing methods |

## Rollback Plan

Revert the change's commits. No schema migration is introduced (no collation change), so rollback is source-only.

## Dependencies

- None external. MySQL 8 already available.

## Success Criteria

- [ ] `"Harina"` matches `"harina"` and `"harina"` does NOT match `"harína"` in all three searches.
- [ ] Only active entities returned; pagination defaults to 10 per page.
- [ ] HU-3 returns products of all líneas under a selected superlínea, paginated.
- [ ] Selection endpoints return slim `SelectOption`-compatible shape.
