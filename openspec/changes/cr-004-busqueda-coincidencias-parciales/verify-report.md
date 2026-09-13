```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:388fa5ee598234193afc3543208afc8e9bb141fa907b3e0b60e7c4abfdfc25e6
verdict: fail
blockers: 0
critical_findings: 1
requirements: 9/15
scenarios: 24/31
test_command: "corepack yarn test src/modules/common/query-builders/query-builder-helpers.spec.ts src/modules/gestion-productos/producto/application/services/producto.service.spec.ts src/modules/gestion-productos/producto/application/controllers/producto.controller.spec.ts src/modules/gestion-productos/producto/dto/search-producto-superlinea.dto.spec.ts src/modules/gestion-productos/linea/application/services/linea.service.spec.ts src/modules/gestion-productos/linea/application/controllers/linea.controller.spec.ts src/modules/gestion-productos/linea/dto/select-linea.dto.spec.ts src/modules/gestion-productos/superlinea/application/services/superlinea.service.spec.ts src/modules/gestion-productos/superlinea/application/controllers/superlinea.controller.spec.ts"
test_exit_code: 0
test_output_hash: sha256:10f44e6b440a1bad7cb344e0938906b90a26cc72b003688e89605c51fbc62703
build_command: "corepack yarn build"
build_exit_code: 0
build_output_hash: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

## Verification Report

**Change**: cr-004-busqueda-coincidencias-parciales
**Version**: N/A (5 delta specs, no versioned base capability)
**Mode**: Strict TDD
**Evidence revision**: HEAD `814351020555fcc8771349ee8e0887e5a5d22bae` (branch `CR-004-slice-5-testing`)
**Scope baseline for diffs**: `82beccf` (pre-CR-004 merge) — `git diff --stat 82beccf..HEAD`

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 23 |
| Tasks complete | 23 |
| Tasks incomplete | 0 |

All 23 checkboxes in `tasks.md` (Phases 1–4) are marked complete. The implementation diff confirms the task-to-file mapping: shared helper, producto search + superlínea join, línea selection, superlínea selection, DTOs, mappers, controllers, and matching specs are all present.

### Build & Tests Execution

**Build**: ✅ Passed (exit 0)
```text
corepack yarn build
BUILD_EXIT=0
(no compiler output; nest build emits nothing on success — build_output_hash is the SHA-256 of the empty stream)
```

**Unit tests (CR-004 scope)**: ✅ 62 passed / 0 failed (exit 0)
```text
corepack yarn test <9 CR-004 spec files>
Test Suites: 9 passed, 9 total
Tests:       62 passed, 62 total
Time:        81.097 s
```

**Unit tests (repo-wide `corepack yarn test`, informational)**: ❌ 83 passed / 20 failed across 47 suites (exit 1)
```text
Test Suites: 22 failed, 25 passed, 47 total
Tests:       20 failed, 83 passed, 103 total
Time:        72.427 s
```
All 22 failing suites are pre-existing and unrelated to CR-004; none of their files appear in `git diff 82beccf..HEAD`:
`organizacion/personal/{service,controller}`, `gestion-usuario/rol/{service,controller}`, `gestion-usuario/usuario/{service,controller}`, `gestion-usuario/auth/{service,controller}`, `gutil/provincia/{service,controller}`, `gutil/condicion-iva/{service,controller}`, `gutil/localidad/{service,controller}`, `gutil/alicuota-iva/{service,controller}`, `organizacion/empresa/{service,controller}`, `organizacion/cliente/cliente.controller`, `gestion-sistema/configuracion-sistema/configuracion-sistema.service`, `gestion-productos/marca/{service,controller}`.
Failure modes are structural in those specs: unresolved DI tokens (e.g. `IRolRepository`, `IEmpresaRepository`, `JwtService`), wrong import paths (`provincia.serviceervice`, `alicuota-iva.service`, `cliente.service`), an empty `marca.service.spec.ts` ("must contain at least one test"), and `this.service.findBy is not a function` in `marca.controller.spec.ts`. `marca` and `alicuota-iva` are explicitly outside CR-004's scope (`docs/Estrategia_de_Testing.md` §9). CR-004 did not regress them; two of them (`superlinea.service.spec.ts`, `superlinea.controller.spec.ts`) were previously listed as failing in `apply-progress.md` and now pass.

**Integration tests (real MySQL 8 via Testcontainers)**: ✅ 23 passed / 0 failed (exit 0)
```text
corepack yarn test:integration
PASS producto.persistence-adapters.int-spec.ts (30.309 s)
PASS linea.persistence-adapter.int-spec.ts (20.634 s)
PASS superlinea.persistence-adapter.int-spec.ts
PASS add-superlinea-to-linea.int-spec.ts
Test Suites: 4 passed, 4 total
Tests:       23 passed, 23 total
Time:        56.942 s
```
Docker available (server 28.0.1); the harness applies the real migrations to a disposable `mysql:8.0` container (`test/integration/global-setup.ts`).

**Coverage**: ➖ Not gated (`openspec/config.yaml` `coverage.threshold: 0`; `docs/Estrategia_de_Testing.md` §2 explicitly rejects a coverage-percentage target)

### Spec Compliance Matrix

Requirement/scenario totals are the actual counts from the 5 delta specs: **15 requirements / 31 scenarios** (partial-coincidence-search 3/7, product-search-by-denominacion 3/7, product-search-by-superlinea 3/5, linea-search-selection 3/6, superlinea-search-selection 3/6).

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| PC-1 Substring containment | Term contained mid-string | `linea.persistence-adapter.int-spec.ts` > "returns the slim SelectOption shape and matches case-insensitively" (matches `harina` in `Alfa harina`) | ✅ COMPLIANT |
| PC-1 Substring containment | Term at the start | `producto.persistence-adapters.int-spec.ts` > "matches case-insensitively against the real MySQL collation" | ✅ COMPLIANT |
| PC-1 Substring containment | Term not contained | (nearest negative cases are accent/soft-delete only; no plain absent-term case) | ⚠️ PARTIAL |
| PC-2 Case-insensitive matching | Different case matches | `producto.persistence-adapters.int-spec.ts` > "matches case-insensitively…" | ✅ COMPLIANT |
| PC-2 Case-insensitive matching | Mixed case matches | `linea.persistence-adapter.int-spec.ts` > "…matches case-insensitively" (`HARINA mayus`); `superlinea.persistence-adapter.int-spec.ts` (`LINEA mayus`) | ✅ COMPLIANT |
| PC-3 Accent-sensitive matching | Accent mismatch does not match | `producto.persistence-adapters.int-spec.ts` > "is accent-sensitive…"; `linea…` > "is accent-sensitive"; `superlinea…` > "is accent-sensitive" | ✅ COMPLIANT |
| PC-3 Accent-sensitive matching | Matching accent matches | (none found — no test searches an accented term expecting a hit) | ❌ UNTESTED |
| PD-1 Search active products by denominación | Matching active products returned | `producto.persistence-adapters.int-spec.ts` > "matches case-insensitively…" | ✅ COMPLIANT |
| PD-1 Search active products by denominación | Accent mismatch excluded | `producto.persistence-adapters.int-spec.ts` > "is accent-sensitive…" | ✅ COMPLIANT |
| PD-1 Search active products by denominación | No match returns empty result | (only `producto.service.spec.ts` > "returns an empty page…" with a mocked repository) | ⚠️ PARTIAL |
| PD-1 Search active products by denominación | Empty term returns empty result | `producto.persistence-adapters.int-spec.ts` > "returns an empty result for empty or whitespace terms"; service + controller specs | ✅ COMPLIANT |
| PD-2 Exclude inactive products | Soft-deleted product excluded | `producto.persistence-adapters.int-spec.ts` > "excludes soft-deleted products" | ✅ COMPLIANT |
| PD-3 Paginated results | First page of ten | `producto.persistence-adapters.int-spec.ts` > "paginates ten rows at a time…" (12 rows → 10) | ✅ COMPLIANT |
| PD-3 Paginated results | Remaining page | `producto.persistence-adapters.int-spec.ts` > "paginates ten rows at a time…" (second page → 2) | ✅ COMPLIANT |
| PS-1 List active products of a superlínea | Products across multiple líneas returned | `producto.persistence-adapters.int-spec.ts` > "returns products from at least two lineas…" | ✅ COMPLIANT |
| PS-1 List active products of a superlínea | Superlínea with no products returns empty | `producto.persistence-adapters.int-spec.ts` > "returns an empty result for an unknown superlinea id" + deleted-superlínea case in "excludes soft-deleted producto, linea and superlinea" | ✅ COMPLIANT |
| PS-2 Exclude inactive products | Soft-deleted product excluded | `producto.persistence-adapters.int-spec.ts` > "excludes soft-deleted producto, linea and superlinea" | ✅ COMPLIANT |
| PS-3 Paginated results | First page of ten | (only `producto.service.spec.ts` > "defaults to a page of 10" against a mock; no DB pagination test for the join) | ⚠️ PARTIAL |
| PS-3 Paginated results | Remaining page | (none found for `findProductosBySuperLinea`) | ⚠️ PARTIAL |
| LI-1 Search active líneas by denominación | Matching active línea returned | `linea.persistence-adapter.int-spec.ts` > "returns the slim SelectOption shape and matches case-insensitively" | ✅ COMPLIANT |
| LI-1 Search active líneas by denominación | Accent mismatch excluded | `linea.persistence-adapter.int-spec.ts` > "is accent-sensitive" | ✅ COMPLIANT |
| LI-1 Search active líneas by denominación | No match returns empty result | (only `linea.service.spec.ts` delegation against a mock) | ⚠️ PARTIAL |
| LI-1 Search active líneas by denominación | Empty term returns empty result | `linea.persistence-adapter.int-spec.ts` > "returns an empty array for an empty or whitespace term"; controller spec | ✅ COMPLIANT |
| LI-2 Exclude inactive líneas | Soft-deleted línea excluded | `linea.persistence-adapter.int-spec.ts` > "excludes soft-deleted lineas" | ✅ COMPLIANT |
| LI-3 Slim selection shape | Slim shape returned | `linea.persistence-adapter.int-spec.ts` > key-set assertion; `linea.service.spec.ts` > `LineaMapper.toSelectOption` | ✅ COMPLIANT |
| SL-1 Search active superlíneas by denominación | Matching active superlínea returned | `superlinea.persistence-adapter.int-spec.ts` > "returns the slim SelectOption shape and matches case-insensitively" | ✅ COMPLIANT |
| SL-1 Search active superlíneas by denominación | Accent mismatch excluded | `superlinea.persistence-adapter.int-spec.ts` > "is accent-sensitive" | ✅ COMPLIANT |
| SL-1 Search active superlíneas by denominación | No match returns empty result | (only `superlinea.service.spec.ts` delegation against a mock) | ⚠️ PARTIAL |
| SL-1 Search active superlíneas by denominación | Empty term returns empty result | `superlinea.persistence-adapter.int-spec.ts` > "returns an empty array for an empty or whitespace term"; controller spec | ✅ COMPLIANT |
| SL-2 Exclude inactive superlíneas | Soft-deleted superlínea excluded | `superlinea.persistence-adapter.int-spec.ts` > "excludes soft-deleted super lineas" | ✅ COMPLIANT |
| SL-3 Slim selection shape | Slim shape returned | `superlinea.persistence-adapter.int-spec.ts` > key-set assertion; `superlinea.service.spec.ts` > `SuperLineaMapper.toSelectOption` | ✅ COMPLIANT |

**Compliance summary**: 24/31 scenarios fully compliant; 6 PARTIAL; 1 UNTESTED.
**Requirement completeness**: 9/15 requirements have every scenario compliant (PC-2; PD-2, PD-3; PS-1, PS-2; LI-2, LI-3; SL-2, SL-3). The remaining six are blocked by the partial/untested scenarios above (PC-1, PC-3, PD-1, PS-3, LI-1, SL-1).

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| Partial-coincidence containment matcher | ✅ Implemented | `QueryBuilderHelper.applyPartialCoincidence()` emits `LOWER(alias.campo) COLLATE utf8mb4_bin LIKE CONCAT('%', LOWER(:termino), '%') COLLATE utf8mb4_bin` — collation applied on both sides (`query-builder-helpers.ts` L32-42). |
| Case-insensitive + accent-sensitive | ✅ Implemented | Real-MySQL integration tests prove `"harina"` matches `"Harina integral"` and excludes `"harína premium"` / `"harína acento"` / `"línea acento"`. |
| Active-only filtering | ✅ Implemented | `BasePersistenceAdapter.baseQuery()` applies `deletedAt IS NULL` for línea/superlínea; producto search applies `.where('producto.deletedAt IS NULL')`; the superlínea join adds `producto/linea/superLinea.deletedAt IS NULL` (`producto.persistence-adapters.ts` L490-517). |
| Producto search endpoint | ✅ Implemented | `GET /producto/search-by-denominacion` → `ProductoService.busquedaPorCoincidenciaParcial()` → adapter; no normalization pipe, preserving accent-sensitive pass-through (`producto.controller.ts` L139-159). |
| Products-by-superlínea join | ✅ Implemented | `GET /producto/search-by-superlinea` filter `superLinea.id = :superLineaId` across `producto → linea → superLinea` (`producto.persistence-adapters.ts` L490-517). |
| 10-per-page default | ✅ Implemented | `PaginationWithDenominacionDto` (skip 0 / take 10), `SearchProductoSuperlineaDto` (take 10), and service defaults `skip = 0, take = 10`. |
| Slim selection shape | ✅ Implemented | `LineaMapper.toSelectOption` / `SuperLineaMapper.toSelectOption` map `id→codigo`, `denominacion→nombre`, `observacion ?? ''→descripcion`; endpoints return the mapped array. |
| Empty/whitespace short-circuit | ✅ Implemented | Adapters trim and return empty without touching the DB (`producto.persistence-adapters.ts` L458-461, línea L259-262, superlínea L113-116), matching the design contract. |

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| D1: static helper + thin per-adapter wrapper (no `BasePersistenceAdapter` generic method, no Producto adapter refactor) | ✅ Yes | Helper used by all three adapters; Producto still uses raw query builders; no scope expansion. |
| D2: containment expression with `COLLATE utf8mb4_bin` on both sides | ✅ Yes | Exact string matches the design contract and the helper spec assertion. |
| D3: no column/table collation change | ✅ Yes | No CR-004 migration; `synchronize` untouched. The `add-superlinea-to-linea` migration/int-spec belongs to CR-003, not CR-004. |
| D4: slim `SelectOption` (`codigo`/`nombre`/`descripcion`) | ✅ Yes | `common/interface/select-option.ts` reused; mappers align with `observacion → descripcion`. |
| Design "File Changes" list | ✅ Yes | Every listed file is present in the diff with the expected responsibility. |
| Documented deviations | ✅ Yes | `superLineaId` query name, omitted `NormalizeDenominacionSearchPipe` on product search, and adapter-level empty-term short-circuit are all recorded in `apply-progress.md` and match the code; none breaks a spec. |

### TDD Compliance (Strict TDD)

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | "TDD Cycle Evidence" table found in `apply-progress.md` (L48-69). |
| All tasks have tests | ✅ | 23/23 tasks map to existing spec files; every CR-004 spec exists in the diff. |
| RED confirmed (tests exist) | ✅ | All 9 unit/controller spec files and 3 CR-004 integration specs exist; RED was recorded as TS2339 missing-method errors. |
| GREEN confirmed (tests pass) | ✅ | Scoped unit 62/62 and integration 23/23 pass on execution now. |
| TDD evidence table complete | ❌ | Rows exist for only 11/23 tasks (Batch 1: 1.1-1.3; Batch 2: 2.1-2.8). Tasks 3.1-3.6 and 4.1-4.6 (12 tasks) have checkbox/files tables but **no TDD Cycle Evidence rows** (no RED/GREEN/TRIANGULATE/SAFETY NET/REFACTOR record). |
| Triangulation adequate | ⚠️ | Tabulated: 1.1 = 3 cases, 2.1 = 4, 2.2 = 3. The producto "accent mismatch" service test is single-case and does not triangulate accent behavior; slices 3-4 are not tabulated. |
| Safety Net for modified files | ⚠️ | `producto.service.spec.ts`, `producto.controller.spec.ts`, `linea.*.spec.ts`, and `superlinea.*.spec.ts` were **modified** per the diff but the table records "N/A (new)" / "N/A (rewrote failing stub)". |
| REFACTOR | ➖ | Subjective; per-task notes present for tabulated tasks only. |

**TDD Compliance**: 4/8 checks passed (2 informational, 2 discrepancies).

### Test Layer Distribution

| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit (helper, services, mappers) | 34 | 4 | Jest + manual injection / `@nestjs/testing` |
| Integration (controller + validation) | 28 | 5 | Jest + Supertest + `ValidationPipe` (in-process, mocked service) |
| Integration (real persistence) | 23 | 4 | Jest + Testcontainers `mysql:8.0` |
| E2E (browser) | 0 | 0 | Not applicable — `docs/Estrategia_de_Testing.md` §5 mandates manual E2E |
| **Total (CR-004 scope)** | **85** | **13** | |

Layer counts: 62 scoped unit/controller tests + 23 persistence integration tests. The strategy's "manual" E2E allowance applies to the frontend combobox binding, which adds no conditional logic beyond these endpoints (§8).

### Changed File Coverage

Coverage from the CR-004-scoped unit run (`jest.config.js` instruments `**/*.(t|j)s`; threshold 0). Persistence adapters show 0% here because they are exercised by the integration config (`jest.config.integration.js` sets `collectCoverage: false`), not the unit run.

| File | Line % | Rating | Note |
|------|--------|--------|------|
| `common/query-builders/query-builder-helpers.ts` | 28.6% (2/7) | ⚠️ Low | Only `applyPartialCoincidence` is exercised by the scoped run; the other public helpers belong to unrelated flows. |
| `producto/application/controllers/producto.controller.ts` | 65.5% (38/58) | ⚠️ Acceptable | New routes covered; pre-existing routes not exercised by the scoped run. |
| `producto/application/services/producto.service.ts` | 30.5% (36/118) | ⚠️ Low | New methods covered; large pre-existing surface outside scope. |
| `producto/dto/search-producto-superlinea.dto.ts` | 100% (10/10) | ✅ Excellent | |
| `producto/infraestructure/repositories/producto.persistence-adapters.ts` | 0% (unit) | ➖ | Covered by `producto.persistence-adapters.int-spec.ts` (integration). |
| `producto/infraestructure/repositories/producto.repository.ts` | 0% (unit) | ➖ | Delegating facade; exercised via integration. |
| `linea/application/controllers/linea.controller.ts` | 76.9% (30/39) | ⚠️ Acceptable | |
| `linea/application/services/linea.service.ts` | 67.5% (52/77) | ⚠️ Acceptable | |
| `linea/dto/select-linea.dto.ts` | 100% (3/3) | ✅ Excellent | |
| `linea/mappers/linea.mapper.ts` | 100% (6/6) | ✅ Excellent | |
| `linea/infraestructure/repositories/linea.persistence-adapter.ts` | 0% (unit) | ➖ | Covered by `linea.persistence-adapter.int-spec.ts` (integration). |
| `linea/infraestructure/repositories/linea.repository.ts` | 0% (unit) | ➖ | Delegating facade; exercised via integration. |
| `superlinea/application/controllers/superlinea.controller.ts` | 87.5% (28/32) | ✅ Excellent | |
| `superlinea/application/services/superlinea.service.ts` | 95.9% (47/49) | ✅ Excellent | |
| `superlinea/mappers/superlinea.mapper.ts` | 100% (4/4) | ✅ Excellent | |
| `superlinea/infraestructure/repositories/superlinea.persistence-adapter.ts` | 0% (unit) | ➖ | Covered by `superlinea.persistence-adapter.int-spec.ts` (integration). |
| `superlinea/infraestructure/repositories/superlinea.repository.ts` | 0% (unit) | ➖ | Delegating facade; exercised via integration. |

**Coverage analysis**: not gated; coverage-by-value policy. The relevant new logic (helper + persistence queries + selection mapping) is covered between the helper unit spec and the persistence integration specs.

### Assertion Quality

| File | Line | Assertion | Issue | Severity |
|------|------|-----------|-------|----------|
| `producto/application/services/producto.service.spec.ts` | 76 | `it('returns an empty page when no denominación contains the term (accent mismatch "harína" vs "harina")')` | Test name claims accent behavior but only mocks the repository to return `[]` and asserts delegation — it exercises no accent logic. The real accent assertion lives in the persistence int-specs. | WARNING |
| `common/query-builders/query-builder-helpers.spec.ts` | 11 & 40 | `expect(result).toBe(query)` | Tests 1 and 3 both assert the same chainability contract; redundant. | SUGGESTION |

**Assertion quality**: 0 CRITICAL, 1 WARNING, 1 SUGGESTION. No tautologies, no ghost loops (the `for` loops in the línea/superlínea int-specs are guarded by a preceding `toHaveLength(2)`), no smoke-test-only cases, and no mock-heavy misuse (mocks ≤ assertions).

### Quality Metrics

**Linter**: ➖ Not run — `yarn lint` is configured with `--fix` (mutating); per `AGENTS.md` it is not valid read-only verification.
**Type Checker**: ✅ `corepack yarn build` exit 0 — TypeScript/Nest compilation passes with no diagnostics.
**Formatter**: ➖ Not run (mutating).

### Issues Found

**CRITICAL**

- **CR-01 — Required scenario "Matching accent matches" has no covering test (PC-3).** The three real-MySQL accent tests all search the *unaccented* term and assert exclusion: `producto.persistence-adapters.int-spec.ts` L71-83 (`harina` vs `harína premium`), `linea.persistence-adapter.int-spec.ts` L78-85 (`harina` vs `harína acento`), `superlinea.persistence-adapter.int-spec.ts` L68-75 (`linea` vs `línea acento`). No test searches an accented term (e.g. `harína`) and asserts a positive match. `producto.controller.spec.ts` L58-75 sends `harína` but against a mocked service (`expect(...).toHaveBeenCalledWith('harína', 0, 10)`) — pass-through only, not a match result. Only the "MUST NOT match across accents" half of the requirement is runtime-verified; the "vice versa" half is unverified. *Recommendation*: add one integration case per adapter int-spec that inserts an accented denominación and searches the accented term expecting the row.

**WARNING**

- **W-01 — PC-1 "Term not contained" lacks a plain absent-term test.** Negative matching is only demonstrated via accent mismatch and soft-delete, not via a term absent from every row (spec example `"Arroz"` / `"trigo"`). *Recommendation*: add an int-spec case asserting an unmatched term yields an empty page.
- **W-02 — PD-1 "No match returns empty result" only covered by a mock.** `producto.service.spec.ts` L76-90 stubs the repository to `[]`; no adapter int-spec asserts a real no-match empty result. *Recommendation*: extend `producto.persistence-adapters.int-spec.ts`.
- **W-03 — PS-3 pagination for the superlínea join is not runtime-verified.** `findProductosBySuperLinea` has no pagination test; `producto.service.spec.ts` L161-174 only asserts the default args (`10, 0, 10`) against a mock. The `15 → 10 + 5` behavior required by the spec is unverified for the join. *Recommendation*: add a 15-product integration case.
- **W-04 — LI-1 / SL-1 "No match returns empty result" only covered by mocks** (`linea.service.spec.ts` L152-164 and `superlinea.service.spec.ts` L278-290 assert delegation only). *Recommendation*: add a real no-match case to each selection int-spec.
- **W-05 — Strict-TDD evidence table is incomplete.** `apply-progress.md` tabulates TDD evidence for only 11/23 tasks; Phases 3 and 4 (tasks 3.1-3.6, 4.1-4.6) have no RED/GREEN/TRIANGULATE/SAFETY NET/REFACTOR rows. Strict TDD requires per-task evidence. *Recommendation*: backfill the table for slices 3-4.
- **W-06 — Safety net misreported as "N/A (new)" for modified files.** `git diff 82beccf..HEAD` shows `producto.service.spec.ts`, `producto.controller.spec.ts`, `linea.service.spec.ts`, `linea.controller.spec.ts`, `superlinea.service.spec.ts`, and `superlinea.controller.spec.ts` were modified (rewritten), not new. *Recommendation*: record the actual pre-existing suite state per strict-TDD safety-net rules.
- **W-07 — Repo-wide `corepack yarn test` exits 1 (22 failed suites / 20 failed tests).** All failures are pre-existing and in modules untouched by CR-004 (listed under Build & Tests Execution); this is a repository condition, not a CR-004 regression. *Recommendation*: track repo-wide suite health separately; do not block CR-004 archival on it, but do not claim the full suite is green.

**SUGGESTION**

- **S-01 — Evidence count discrepancy.** `apply-progress.md` L40 claims 4 supertest cases in `producto.controller.spec.ts`; the file contains 5 `it` blocks.
- **S-02 — Redundant helper assertions.** `query-builder-helpers.spec.ts` tests 1 and 3 both assert chainability.
- **S-03 — Misleading test name.** `producto.service.spec.ts` L76 labels a delegation test as an accent test (see Assertion Quality).
- **S-04 — No-op query parameter.** `GET /producto/search-by-denominacion` reuses `PaginationWithDenominacionDto`, which accepts `incluirEliminados`; the controller ignores it and the adapter always filters `deletedAt IS NULL`. It is validated but silently discarded. Not a spec violation (active-only is required), but consider a dedicated DTO to avoid a misleading contract.
- **S-05 — Design open questions not closed in the artifacts.** `design.md` L117-119 lists three open questions; `GET /producto/search-by-denominacion` and `observacion → descripcion` are resolved in code, but the HU-2 "products of a selected línea" question is only implicitly served by the pre-existing `findBy` `lineaId` filter and is not recorded. *Recommendation*: annotate the resolution/deferral in the change artifacts.

### Verdict

**FAIL**

The implementation is complete (23/23 tasks) and appears correct: all 5 requirements are traceable to code, the shared matcher uses the exact collation contract, active-only filtering and the superlínea join are real-DB verified, and the change's own suites are green (62 unit/controller tests and 23 real-MySQL integration tests, build exit 0). The FAIL is a **verification-coverage** failure, not an observed production defect: one required scenario (`partial-coincidence-search` → "Matching accent matches") has no covering test and six further scenarios are only partially covered by mocks rather than runtime behavior, and the strict-TDD per-task evidence table is incomplete for 12/23 tasks. Close CR-01 (and ideally W-01…W-04) with integration tests and backfill the TDD evidence before archival.
