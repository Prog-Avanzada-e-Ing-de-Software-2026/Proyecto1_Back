# Tasks: CR-004 — Partial-Coincidence Search by Denominación, Línea, and SuperLínea

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~450 across 26 files |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (helper) → PR 2 (producto) → PR 3 (línea) → PR 4 (superlínea) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Shared `applyPartialCoincidence()` + spec | PR 1 | `yarn test query-builder-helpers` | N/A — mocked SelectQueryBuilder, no DB | Revert helper + spec only |
| 2 | HU-1 denominación search + HU-3 products-by-superlínea (producto) | PR 2 | `yarn test producto` | N/A — mocked repo + supertest | Revert producto module files |
| 3 | HU-2 línea selection (linea) | PR 3 | `yarn test linea` | N/A — mocked repo + supertest | Revert linea module files |
| 4 | HU-3 superlínea selection (superlinea) | PR 4 | `yarn test superlinea` | N/A — mocked repo + supertest | Revert superlinea module files |

PR 1 must land before PRs 2–4 (they import the helper).

## Phase 1: Shared helper (PR 1)

- [x] 1.1 RED — create `src/modules/common/query-builders/query-builder-helpers.spec.ts` asserting `andWhere` emits `LOWER(col) COLLATE utf8mb4_bin LIKE CONCAT('%', LOWER(:termino), '%')` (spec partial-coincidence-search).
- [x] 1.2 GREEN — add static `applyPartialCoincidence<T>(query, alias, campo, termino)` to `src/modules/common/query-builders/query-builder-helpers.ts`.
- [x] 1.3 REFACTOR — run `yarn test query-builder-helpers`; confirm green.

## Phase 2: Producto — HU-1 + HU-3 (PR 2)

- [x] 2.1 RED — `producto.service.spec.ts`: active `"Harina integral"` matches `"harina"`; `"harína"` excludes `"harina"`; empty term → `{data:[],total:0}`; page of 10 (spec product-search-by-denominacion).
- [x] 2.2 RED — `producto.service.spec.ts`: products across two líneas under one superlínea returned; soft-deleted excluded; page of 10 (spec product-search-by-superlinea).
- [x] 2.3 GREEN — add `busquedaPorCoincidenciaParcial(denominacion, skip, take)` + `findProductosBySuperLinea(superLineaId, skip, take)` to `producto.repository-interface.ts`; delegate in `producto.repository.ts`.
- [x] 2.4 GREEN — implement both in `producto.persistence-adapters.ts` using the shared `applyPartialCoincidence` helper + empty-term short-circuit; join `producto.linea.superLinea` with 3× `deletedAt IS NULL`.
- [x] 2.5 GREEN — add `ProductoService` methods in `producto.service.ts` mapping via `ProductoMapper` + `PaginacionUtils.totalItems`.
- [x] 2.6 GREEN — add `GET /producto/search-by-denominacion` (reuse `PaginationWithDenominacionDto`) and `GET /producto/search-by-superlinea` (new `src/modules/gestion-productos/producto/dto/search-producto-superlinea.dto.ts`) in `producto.controller.ts`; Swagger-decorate.
- [x] 2.7 RED→GREEN — add supertest cases in `producto.controller.spec.ts` for both routes (10-per-page, accent).
- [x] 2.8 REFACTOR — `yarn test producto` + `yarn build`.

## Phase 3: Línea — HU-2 (PR 3)

- [x] 3.1 RED — `linea.service.spec.ts`: slim `SelectOption` (codigo/nombre/descripcion); accent mismatch excluded; empty term → `[]` (spec linea-search-selection).
- [x] 3.2 GREEN — add `toSelectOption()` to `linea.mapper.ts` (id→codigo, denominacion→nombre, observacion??''→descripcion).
- [x] 3.3 GREEN — add `busquedaPorCoincidenciaParcial(denominacion): Promise<SelectOption[]>` to `linea.repository.interface.ts`, `linea.repository.ts`, `linea.persistence-adapter.ts` (helper + short-circuit).
- [x] 3.4 GREEN — add service method + `GET /linea/select` in `linea.controller.ts`.
- [x] 3.5 RED→GREEN — add supertest case in `linea.controller.spec.ts` for `/api/linea/select`.
- [x] 3.6 REFACTOR — `yarn test linea`.

## Phase 4: SuperLínea — HU-3 (PR 4)

- [x] 4.1 RED — `superlinea.service.spec.ts`: slim `SelectOption`; `"almacen"` excludes `"almacén"`; empty term → `[]` (spec superlinea-search-selection).
- [x] 4.2 GREEN — add `toSelectOption()` to `superlinea.mapper.ts`.
- [x] 4.3 GREEN — add `busquedaPorCoincidenciaParcial` to `superlinea.repository.interface.ts`, `superlinea.repository.ts`, `superlinea.persistence-adapter.ts`.
- [x] 4.4 GREEN — rewire `superlinea.controller.ts` `select` to return slim `SelectOption[]`; keep `findAllFor` untouched.
- [x] 4.5 RED→GREEN — update `superlinea.controller.spec.ts` `/api/superlinea/select` assertions to slim shape.
- [x] 4.6 REFACTOR — full `yarn test` + `yarn build`.
