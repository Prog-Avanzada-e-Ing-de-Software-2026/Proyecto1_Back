# Apply Progress: CR-004 — Partial-Coincidence Search by Denominación, Línea, and SuperLínea

**Change**: cr-004-busqueda-coincidencias-parciales
**Mode**: Strict TDD (openspec/config.yaml `strict_tdd: true`, runner `yarn test` → Jest 29.7)
**Chain strategy**: feature-branch-chain (PR #1 targets tracker branch `CR-004`; PR #2 targets PR #1's branch)

## Completed Tasks (cumulative)

### Batch 1 — Slice 1 / PR 1 (shared helper)

- [x] 1.1 RED — create `src/modules/common/query-builders/query-builder-helpers.spec.ts`
- [x] 1.2 GREEN — add static `applyPartialCoincidence<T>(query, alias, campo, termino)` to `query-builder-helpers.ts`
- [x] 1.3 REFACTOR — run `yarn test query-builder-helpers`; confirm green

### Batch 2 — Slice 2 / PR 2 (Producto — HU-1 + HU-3)

- [x] 2.1 RED — `producto.service.spec.ts`: denominación search scenarios (spec product-search-by-denominacion)
- [x] 2.2 RED — `producto.service.spec.ts`: products-by-superlínea scenarios (spec product-search-by-superlinea)
- [x] 2.3 GREEN — add `busquedaPorCoincidenciaParcial` + `findProductosBySuperLinea` to `producto.repository-interface.ts`; delegate in `producto.repository.ts`
- [x] 2.4 GREEN — implement both in `producto.persistence-adapters.ts` (helper + empty-term short-circuit; join with 3× `deletedAt IS NULL`)
- [x] 2.5 GREEN — add `ProductoService` methods mapping via `ProductoMapper` + `PaginacionUtils.totalItems`
- [x] 2.6 GREEN — add `GET /producto/search-by-denominacion` + `GET /producto/search-by-superlinea` + `search-producto-superlinea.dto.ts`
- [x] 2.7 RED→GREEN — supertest cases in `producto.controller.spec.ts` for both routes
- [x] 2.8 REFACTOR — `yarn test producto` + `yarn build`

## Files Changed

### Batch 1 (Slice 1)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/modules/common/query-builders/query-builder-helpers.spec.ts` | Created | 3 unit tests asserting the `andWhere` fragment + parameter + chainability |
| `src/modules/common/query-builders/query-builder-helpers.ts` | Modified | Added static `applyPartialCoincidence<T extends ObjectLiteral>(query, alias, campo, termino)` |

### Batch 2 (Slice 2)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/modules/gestion-productos/producto/application/services/producto.service.spec.ts` | Rewritten | 7 unit tests for `busquedaPorCoincidenciaParcial` + `findProductosBySuperLinea` (delegation, mapping, empty-term, pagination) |
| `src/modules/gestion-productos/producto/application/controllers/producto.controller.spec.ts` | Rewritten | 5 supertest cases for both new routes (10-per-page, accent, missing-id 400) |
| `src/modules/gestion-productos/producto/domain/interfaces/producto.repository-interface.ts` | Modified | Added `busquedaPorCoincidenciaParcial(denominacion, skip, take)` + `findProductosBySuperLinea(superLineaId, skip, take)` |
| `src/modules/gestion-productos/producto/infraestructure/repositories/producto.repository.ts` | Modified | Delegate both new methods to `ProductoPersistenceAdapter` |
| `src/modules/gestion-productos/producto/infraestructure/repositories/producto.persistence-adapters.ts` | Modified | Implemented both via `QueryBuilderHelper.applyPartialCoincidence` + empty-term short-circuit; `producto.linea.superLinea` join with 3× `deletedAt IS NULL` |
| `src/modules/gestion-productos/producto/application/services/producto.service.ts` | Modified | Added both service methods mapping via `ProductoMapper.toBusquedaDto` + `PaginacionUtils.totalItems` |
| `src/modules/gestion-productos/producto/application/controllers/producto.controller.ts` | Modified | Added `GET search-by-denominacion` + `GET search-by-superlinea` (Swagger `@ApiOkResponse`) |
| `src/modules/gestion-productos/producto/dto/search-producto-superlinea.dto.ts` | Created | `superLineaId` (required int) + `skip` + `take` query DTO |

## TDD Cycle Evidence

### Batch 1 (Slice 1)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `query-builder-helpers.spec.ts` | Unit | N/A (new) | ✅ Written (TS2339) | — | ✅ 3 cases | — |
| 1.2 | `query-builder-helpers.spec.ts` | Unit | N/A (new) | — | ✅ Passed 3/3 | — | — |
| 1.3 | `query-builder-helpers.spec.ts` | Unit | N/A (new) | — | ✅ Passed 3/3 | — | ➖ None needed |

### Batch 2 (Slice 2)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 2.1 | `producto.service.spec.ts` | Unit | Pre-existing spec was a trivial `should be defined` stub that failed to compile (unresolved `ProductoService` constructor deps) — no green baseline; rewritten with mocked repository | ✅ Written — `TS2339: Property 'busquedaPorCoincidenciaParcial' does not exist on type 'ProductoService'` | — | ✅ 4 cases (matches, empty-accent, empty-term, page-10) | — |
| 2.2 | `producto.service.spec.ts` | Unit | Same pre-existing broken stub as 2.1 — no green baseline; rewritten | ✅ Written — `TS2339: Property 'findProductosBySuperLinea' does not exist` | — | ✅ 3 cases (multi-línea, soft-deleted, page-10) | — |
| 2.3 | `producto.service.spec.ts` (contract exercised via mocked repo) | Unit | Pre-existing stub broken (see 2.1) | — | ✅ type-checks (`yarn build`) | ➖ structural (delegation) | — |
| 2.4 | `producto.persistence-adapters.int-spec.ts` (real MySQL) | Integration | New int-spec against the Testcontainers harness | — | ✅ type-checks (`yarn build`); real-DB int-spec green | ✅ 5 cases (case/position, accent exclude, empty term, soft-delete, pagination) | — |
| 2.5 | `producto.service.spec.ts` | Unit | Pre-existing stub broken (see 2.1) | — | ✅ Passed 7/7 | — | — |
| 2.6 | `producto.controller.spec.ts` (supertest) | Integration | Pre-existing controller spec was a trivial `should be defined` stub (`ProductoService` not provided as a mock) — no green baseline; rewritten | — | ✅ type-checks (`yarn build`); supertest green | ✅ 5 cases (10-per-page, accent pass-through, missing-id 400) | — |
| 2.7 | `producto.controller.spec.ts` | Integration (supertest) | Pre-existing stub broken (see 2.6) | ✅ Written — routes returned 400 via `@Get(':id')` ParseIntPipe fallthrough | ✅ Passed 5/5 | ✅ 5 cases | — |
| 2.8 | both spec files | Unit+Integration | Pre-existing producto specs broken (see 2.1/2.6) | — | ✅ Passed 12/12 + `yarn build` exit 0 | — | ✅ clean |

### Batch 3 (Slice 3)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 3.1 | `linea.service.spec.ts` | Unit | Pre-existing spec green before the change (linea suite was not in the failing baseline set); extended with selection-search + mapper cases | ✅ Written — `TS2339: Property 'busquedaPorCoincidenciaParcial' does not exist` on `LineaService` and `LineaMapper.toSelectOption` missing | — | ✅ 3 cases (delegation, slim mapper shape, null observacion → `''`) | — |
| 3.2 | `linea.service.spec.ts` (`LineaMapper.toSelectOption`) | Unit | Pre-existing spec green (see 3.1) | — | ✅ Passed (mapper 2/2) | ✅ 2 cases (populated + null observacion) | — |
| 3.3 | `linea.persistence-adapter.int-spec.ts` (real MySQL) | Integration | New int-spec against the Testcontainers harness; pre-existing service spec was green | — | ✅ Real-DB int-spec green (slim shape, case-insensitive, accent exclude, empty term, soft-delete, ordering) | ✅ 6 cases | — |
| 3.4 | `linea.service.spec.ts` (delegation) | Unit | Pre-existing spec green (see 3.1) | — | ✅ type-checks (`yarn build`) + service delegation spec via 3.1 | ➖ structural | — |
| 3.5 | `linea.controller.spec.ts` | Integration (supertest) | Pre-existing spec green before the change; extended with the new `/api/linea/select` route cases | ✅ Written — route absent, `/api/linea/select` answered 404 | ✅ Passed (3 select cases) | ✅ 3 cases (slim success, omitted term → `[]`, non-whitelisted param 400) | — |
| 3.6 | `linea.service.spec.ts`, `linea.controller.spec.ts`, `linea.persistence-adapter.int-spec.ts` | Unit + Integration | — | — | ✅ `yarn test linea` + `corepack yarn test:integration` green | — | ✅ clean |

### Batch 4 (Slice 4)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 4.1 | `superlinea.service.spec.ts` | Unit | Pre-existing spec was RED before the change (listed among the failing suites during Batch 2 — unresolved constructor deps); rewritten and extended | ✅ Written — `TS2339: Property 'busquedaPorCoincidenciaParcial' does not exist` on `SuperLineaService` and `SuperLineaMapper.toSelectOption` missing | — | ✅ 3 cases (delegation, slim mapper shape, null observacion → `''`) | — |
| 4.2 | `superlinea.service.spec.ts` (`SuperLineaMapper.toSelectOption`) | Unit | Pre-existing spec RED (see 4.1) | — | ✅ Passed (mapper 2/2) | ✅ 2 cases (populated + null observacion) | — |
| 4.3 | `superlinea.persistence-adapter.int-spec.ts` (real MySQL) | Integration | New int-spec against the Testcontainers harness; pre-existing service spec RED (see 4.1) | — | ✅ Real-DB int-spec green (slim shape, case-insensitive, accent exclude, empty term, soft-delete, ordering) | ✅ 6 cases | — |
| 4.4 | `superlinea.controller.spec.ts` (slim `select`) | Integration (supertest) | Pre-existing spec RED before the change (unresolved DI; listed failing during Batch 2); rewritten | — | ✅ type-checks (`yarn build`) + supertest slim assertions via 4.5 | ➖ structural (rewire `findAllFor` → `busquedaPorCoincidenciaParcial`) | — |
| 4.5 | `superlinea.controller.spec.ts` | Integration (supertest) | Pre-existing spec RED (see 4.4) | ✅ Written — baseline `select` still called `findAllFor` and returned full entities, so the slim `SelectOption[]` assertions failed | ✅ Passed (3 select + 3 other routes) | ✅ 3 select cases (slim success, omitted term → `[]`, non-whitelisted param 400) | — |
| 4.6 | all superlinea specs + repo-wide `corepack yarn test` + `yarn build` | Unit + Integration | — | — | ✅ full `corepack yarn test` no new failures (22 failed suites / 20 failed tests, all pre-existing) + `yarn build` exit 0 | — | ✅ clean |

### Test Summary

- **Total tests written (this batch)**: 12 (7 service + 5 controller; the controller spec gained its fifth case during the later layer-alignment pass)
- **Total tests passing (this batch)**: 12
- **Layers used**: Unit (7), Integration (5)
- **Approval tests** (refactoring): None — no refactoring of existing behavior
- **Pure functions created**: 0 (reused Slice 1's `applyPartialCoincidence`)

## Work Unit Evidence

| Evidence | Required value |
|---|---|
| Focused test command and exact result | `yarn test src/modules/gestion-productos/producto/application` → `PASS producto.service.spec.ts`, `PASS producto.controller.spec.ts`; `Test Suites: 2 passed, 2 total`; `Tests: 12 passed, 12 total` |
| Runtime harness command/scenario and exact result | `N/A` — service unit tests use a mocked repository; controller tests use supertest with a mocked `ProductoService` and an overridden `AuthGuard`. No live MySQL boundary exists in this environment; the accent-sensitive SQL is asserted by the Slice 1 helper spec (SQL fragment), not a running DB |
| Rollback boundary | Revert only the producto module files: `producto.repository-interface.ts`, `producto.repository.ts`, `producto.persistence-adapters.ts`, `producto.service.ts`, `producto.controller.ts`, `dto/search-producto-superlinea.dto.ts`, plus the two rewritten spec files. No other module touched |

## Deviations from Design

- `SearchProductoSuperlineaDto` uses `superLineaId` as the query param name (matches `Linea.superLineaId` and `IProductoRepository.findProductosBySuperLinea`), consistent with the entity's column naming; the design did not prescribe a field name.
- No `NormalizeDenominacionSearchPipe` applied to `search-by-denominacion`: the pipe uppercases the term, which is redundant with the SQL `LOWER(...) COLLATE utf8mb4_bin` and would complicate the accent-sensitive contract. The term passes through verbatim; accent-sensitivity is preserved by the SQL expression.
- Empty-term short-circuit lives in the persistence adapter (per task 2.4 / design "no DB query"), not the service; the service test asserts the empty-term result through the repository contract.

## Issues Found

- The pre-existing `producto.service.spec.ts` and `producto.controller.spec.ts` were trivial "should be defined" stubs that failed to compile (unresolved constructor dependencies). Replaced with mocked unit/supertest specs as assigned.
- `yarn test producto` still reports 4 pre-existing failing suites (`marca.service.spec.ts`, `marca.controller.spec.ts`, `superlinea.service.spec.ts`, `superlinea.controller.spec.ts`) unrelated to this change and outside the assigned slice (marca / superlínea are Phase 4 or other modules). Not touched.

### Batch 3 — Slice 3 / PR 3 (Línea — HU-2)

- [x] 3.1 RED — `linea.service.spec.ts`: slim `SelectOption`; accent mismatch excluded; empty term → `[]`
- [x] 3.2 GREEN — add `toSelectOption()` to `linea.mapper.ts`
- [x] 3.3 GREEN — add `busquedaPorCoincidenciaParcial` to `linea.repository.interface.ts`, `linea.repository.ts`, `linea.persistence-adapter.ts`
- [x] 3.4 GREEN — add service method + `GET /linea/select` in `linea.controller.ts`
- [x] 3.5 RED→GREEN — supertest case in `linea.controller.spec.ts` for `/api/linea/select`
- [x] 3.6 REFACTOR — `yarn test linea`

## Files Changed

### Batch 3 (Slice 3)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/modules/gestion-productos/linea/mappers/linea.mapper.ts` | Modified | Added `toSelectOption(entity)` → `{codigo, nombre, descripcion}` |
| `src/modules/gestion-productos/linea/domain/interfaces/linea.repository.interface.ts` | Modified | Added `busquedaPorCoincidenciaParcial(denominacion): Promise<SelectOption[]>` |
| `src/modules/gestion-productos/linea/infraestructure/repositories/linea.repository.ts` | Modified | Delegates to persistence adapter |
| `src/modules/gestion-productos/linea/infraestructure/repositories/linea.persistence-adapter.ts` | Modified | Implemented with `applyPartialCoincidence` helper + empty-term short-circuit |
| `src/modules/gestion-productos/linea/application/services/linea.service.ts` | Modified | Added `busquedaPorCoincidenciaParcial` delegation |
| `src/modules/gestion-productos/linea/application/services/linea.service.spec.ts` | Rewritten | Tests for search: accent-sensitive, empty-term, delegation |
| `src/modules/gestion-productos/linea/application/controllers/linea.controller.ts` | Modified | Added `GET /linea/select` endpoint |
| `src/modules/gestion-productos/linea/application/controllers/linea.controller.spec.ts` | Rewritten | Supertest for `/api/linea/select` |

### Batch 4 — Slice 4 / PR 4 (SuperLínea — HU-3)

- [x] 4.1 RED — `superlinea.service.spec.ts`: slim `SelectOption`; `"almacen"` excludes `"almacén"`; empty term → `[]`
- [x] 4.2 GREEN — add `toSelectOption()` to `superlinea.mapper.ts`
- [x] 4.3 GREEN — add `busquedaPorCoincidenciaParcial` to `superlinea.repository.interface.ts`, `superlinea.repository.ts`, `superlinea.persistence-adapter.ts`
- [x] 4.4 GREEN — rewire `superlinea.controller.ts` `select` to return slim `SelectOption[]`; keep `findAllFor` untouched
- [x] 4.5 RED→GREEN — update `superlinea.controller.spec.ts` `/api/superlinea/select` assertions to slim shape
- [x] 4.6 REFACTOR — `yarn test superlinea`

## Files Changed

### Batch 4 (Slice 4)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/modules/gestion-productos/superlinea/mappers/superlinea.mapper.ts` | Modified | Added `toSelectOption(entity)` → `{codigo, nombre, descripcion}` |
| `src/modules/gestion-productos/superlinea/domain/interfaces/superlinea.repository.interface.ts` | Modified | Added `busquedaPorCoincidenciaParcial(denominacion): Promise<SelectOption[]>` |
| `src/modules/gestion-productos/superlinea/infraestructure/repositories/superlinea.repository.ts` | Modified | Delegates to persistence adapter |
| `src/modules/gestion-productos/superlinea/infraestructure/repositories/superlinea.persistence-adapter.ts` | Modified | Implemented with `applyPartialCoincidence` helper + empty-term short-circuit |
| `src/modules/gestion-productos/superlinea/application/services/superlinea.service.ts` | Modified | Added `busquedaPorCoincidenciaParcial` delegation |
| `src/modules/gestion-productos/superlinea/application/services/superlinea.service.spec.ts` | Rewritten | Tests for search: accent-sensitive (`"almacen"` vs `"almacén"`), empty-term, delegation |
| `src/modules/gestion-productos/superlinea/application/controllers/superlinea.controller.ts` | Modified | Rewired `select` to `busquedaPorCoincidenciaParcial` (slim `SelectOption[]`), Swagger-decorated |
| `src/modules/gestion-productos/superlinea/application/controllers/superlinea.controller.spec.ts` | Rewritten | Supertest for `/api/superlinea/select` slim shape |

## Remaining Tasks

- None — all 23 tasks (Phases 1–4) complete.

## Workload / PR Boundary

- **Mode**: chained PR slices (feature-branch-chain)
- **Slices completed**: 4 / 4 — helper (PR 1), producto (PR 2), línea (PR 3), superlínea (PR 4)
- **Boundary**: one module per slice; PR 1 also carries the CR-004 SDD change artifacts
- **Chain strategy**: feature-branch-chain — PR #1 targets tracker `CR-004`; PR #2 targets PR #1's branch; PR #3 targets PR #2's branch; PR #4 targets PR #3's branch
- **Review budget**: each slice ≤400 authored lines; PR 2 (producto, 453) already accepted as `size:exception`

## Testing Strategy Compliance (applied post-apply)

The team testing strategy (`docs/Estrategia_de_Testing.md`) was applied to CR-004. Scope is the `gestion-productos` module; `ProductoOperacion` and non-product modules stay out of scope.

| Layer | Artifacts | Type |
|-------|-----------|------|
| Endpoints | `producto`/`linea`/`superlinea` `.controller.spec.ts` | Integration — one success + one failure path per endpoint |
| Services | `producto`/`linea`/`superlinea` `.service.spec.ts` | Unit with mocks — only methods with logic/decisions |
| Persistence | `producto`/`linea`/`superlinea` `.persistence-adapter*.int-spec.ts` + `add-superlinea-to-linea.int-spec.ts` | Real integration (MySQL 8 via Testcontainers) |
| DTO | `select-linea.dto.spec.ts`, `search-producto-superlinea.dto.spec.ts` | Unit — declarative validation values |

- Integration harness: `test/integration/` + `jest.config.integration.js`; run with `corepack yarn test:integration`.
- Unit: `corepack yarn test` → 25 suites / 83 tests green (remaining failures are pre-existing and unrelated to CR-004).
- Integration: `corepack yarn test:integration` → 4 suites / 30 tests green.
- Build: `corepack yarn build` → exit 0.
- Deferred: a dedicated `SelectSuperLineaDto` unit spec (identical to `SelectLineaDto`; contract covered at the endpoint layer). Risk: low.

## Coverage Remediation (CR-01, W-01–W-04)

The SDD verify report (`verify-report.md`, evidence revision `388fa5e`) flagged one required scenario and three partial scenarios that were only covered by mocks. They were closed with real-MySQL integration cases against the existing Testcontainers harness; no production/source file changed.

| Finding | Scenario | Test added | Adapter |
|---------|----------|------------|---------|
| CR-01 | PC-3 "Matching accent matches" | `matches an accented term against an accented denominación only` | producto / linea / superlinea int-specs |
| W-01 | PC-1 "Term not contained" | `returns an empty page when the term is not contained in any denominación` | producto int-spec |
| W-02 | PD-1 "No match returns empty result" | `returns an empty page when the term is not contained in any denominación` | producto int-spec |
| W-03 | PS-3 "Paginated results" (join) | `paginates the superlinea join ten rows at a time…` (15 rows → 10 + 5) | producto int-spec |
| W-04 | LI-1 / SL-1 "No match returns empty result" | `returns an empty array when the term is not contained in any denominación` | linea / superlinea int-specs |

Verification after remediation: `corepack yarn test:integration` → `Test Suites: 4 passed, 4 total`; `Tests: 30 passed, 30 total`. Repo-wide `corepack yarn test` unchanged at 22 failed suites / 20 failed tests (all pre-existing). `corepack yarn build` → exit 0.

