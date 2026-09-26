```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:03f30ea5fb7bbc1c25416d0a36e0b6d969af50e385758975e2685870e3e1de30
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 15/15
scenarios: 31/31
test_command: "corepack yarn test src/modules/common/query-builders/query-builder-helpers.spec.ts src/modules/gestion-productos/producto/application/services/producto.service.spec.ts src/modules/gestion-productos/producto/application/controllers/producto.controller.spec.ts src/modules/gestion-productos/producto/dto/search-producto-superlinea.dto.spec.ts src/modules/gestion-productos/linea/application/services/linea.service.spec.ts src/modules/gestion-productos/linea/application/controllers/linea.controller.spec.ts src/modules/gestion-productos/linea/dto/select-linea.dto.spec.ts src/modules/gestion-productos/superlinea/application/services/superlinea.service.spec.ts src/modules/gestion-productos/superlinea/application/controllers/superlinea.controller.spec.ts"
test_exit_code: 0
test_output_hash: sha256:ec652ff3710ef280fb19956038afa9a1254387f30655b2659fc5243b62d65ea4
build_command: "corepack yarn build"
build_exit_code: 0
build_output_hash: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

## Verification Report

**Change**: cr-004-busqueda-coincidencias-parciales
**Version**: N/A (5 delta specs, no versioned base capability)
**Mode**: Strict TDD
**Evidence revision**: HEAD `6d1d9d0e5816d3208ab0ceb441582595efeb6f7a` (branch `CR-004-slice-5-testing`)
**Scope baseline for diffs**: `82beccf` (pre-CR-004 merge)
**Re-verification**: previous report (HEAD `8143510`, evidence revision `388fa5e`) returned `fail`. This pass re-runs the suite against HEAD `6d1d9d0` after remediation commit `6d1d9d0 "test(cr-004): close verify coverage gaps"`.

### Remediation Scope (what actually changed)

`git show --stat 6d1d9d0` touches only 4 files and **no production source**:

| File | Change |
|------|--------|
| `apply-progress.md` | +65/-14 — slices 3 and 4 TDD evidence rows backfilled |
| `producto.persistence-adapters.int-spec.ts` | +40 — positive-accent, no-match, join-pagination cases |
| `linea.persistence-adapter.int-spec.ts` | +17 — positive-accent, no-match cases |
| `superlinea.persistence-adapter.int-spec.ts` | +17 — positive-accent, no-match cases |

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 23 |
| Tasks complete | 23 |
| Tasks incomplete | 0 |

All 23 checkboxes in `tasks.md` (Phases 1-4) are complete. The remediation did not alter `tasks.md`; the five delta specs are unchanged from the pre-fail revision, so the authoritative totals remain 15 requirements / 31 scenarios.

### Build & Tests Execution

**Build**: PASSED (exit 0)
```text
corepack yarn build
BUILD_EXIT=0
(no compiler output; nest build emits nothing on success — build_output_hash is the SHA-256 of the empty stream)
```

**CR-004 scoped unit/controller tests**: PASSED 62/62 (exit 0)
```text
corepack yarn test <9 CR-004 spec files>
Test Suites: 9 passed, 9 total
Tests:       62 passed, 62 total
Time:        63.542 s
```

**Integration tests (real MySQL 8 via Testcontainers)**: PASSED 30/30 (exit 0)
```text
corepack yarn test:integration
PASS src/modules/gestion-productos/producto/infraestructure/repositories/producto.persistence-adapters.int-spec.ts
PASS src/modules/gestion-productos/linea/infraestructure/repositories/linea.persistence-adapter.int-spec.ts
PASS src/modules/gestion-productos/superlinea/infraestructure/repositories/superlinea.persistence-adapter.int-spec.ts
PASS src/migrations/add-superlinea-to-linea.int-spec.ts
Test Suites: 4 passed, 4 total
Tests:       30 passed, 30 total
Time:        19.891 s
```
Docker server 28.0.1 present; the harness applies real migrations to a disposable `mysql:8.0` container (`test/integration/global-setup.ts`). The count moved 23 -> 30 versus the pre-fail revision, matching the 7 added integration cases.

**Repo-wide unit tests (`corepack yarn test`, informational)**: FAILED exit 1 — 22 failed suites / 25 passed; 20 failed tests / 83 passed. All 22 failing suites are pre-existing and outside CR-004's scope; none of the CR-004 spec files appears in the failure set.
```text
Test Suites: 22 failed, 25 passed, 47 total
Tests:       20 failed, 83 passed, 103 total
Time:        81.505 s
```
Failing suites (grouped): `gestion-productos/marca/{service,controller}`, `gestion-sistema/configuracion-sistema/service`, `gestion-usuario/{auth,rol,usuario}/{service,controller}`, `gutil/{alicuota-iva,condicion-iva,localidad,provincia}/{service,controller}`, `organizacion/cliente/controller`, `organizacion/empresa/{service,controller}`, `organizacion/personal/{service,controller}`. These are structural pre-existing failures (unresolved DI tokens, wrong import paths, an empty `marca.service.spec.ts`) in modules `docs/Estrategia_de_Testing.md` §1/§9 explicitly excludes; `git diff 82beccf..HEAD` does not touch them. CR-004's own suites pass.

**Coverage**: not gated (`openspec/config.yaml` `coverage.threshold: 0`; `docs/Estrategia_de_Testing.md` §2 rejects a percentage target). Measured for this pass with the scoped run (`corepack yarn test:cov -- <9 CR-004 spec files>`, exit 0, 9 suites / 62 tests).

### Spec Compliance Matrix

Requirement/scenario totals are the actual counts from the 5 delta specs: **15 requirements / 31 scenarios** (partial-coincidence-search 3/7, product-search-by-denominacion 3/7, product-search-by-superlinea 3/5, linea-search-selection 3/6, superlinea-search-selection 3/6).

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| PC-1 Substring containment | Term contained mid-string | `linea.persistence-adapter.int-spec.ts` > "returns the slim SelectOption shape and matches case-insensitively" (`harina` inside `Alfa harina`) | COMPLIANT |
| PC-1 Substring containment | Term at the start | `producto.persistence-adapters.int-spec.ts` > "matches case-insensitively against the real MySQL collation" (`harina` prefix of `Harina integral`) | COMPLIANT |
| PC-1 Substring containment | Term not contained | `producto.persistence-adapters.int-spec.ts` > "returns an empty page when the term is not contained in any denominación" (`Arroz` vs `trigo`); same negative case in linea/superlinea int-specs | COMPLIANT |
| PC-2 Case-insensitive matching | Different case matches | `producto.persistence-adapters.int-spec.ts` > "matches case-insensitively against the real MySQL collation" | COMPLIANT |
| PC-2 Case-insensitive matching | Mixed case matches | `linea.persistence-adapter.int-spec.ts` > "…matches case-insensitively" (`HARINA mayus`); `superlinea.persistence-adapter.int-spec.ts` (`LINEA mayus`) | COMPLIANT |
| PC-3 Accent-sensitive matching | Accent mismatch does not match | `producto/linea/superlinea` int-specs > "is accent-sensitive…" (`harina` excludes `harína`) | COMPLIANT |
| PC-3 Accent-sensitive matching | Matching accent matches | `producto/linea/superlinea` int-specs > "matches an accented term against an accented denominación only" (`harína` matches `harína premium`, excludes `Harina integral`) | COMPLIANT |
| PD-1 Search active products by denominación | Matching active products returned | `producto.persistence-adapters.int-spec.ts` > "matches case-insensitively…" | COMPLIANT |
| PD-1 Search active products by denominación | Accent mismatch excluded | `producto.persistence-adapters.int-spec.ts` > "is accent-sensitive…" | COMPLIANT |
| PD-1 Search active products by denominación | No match returns empty result | `producto.persistence-adapters.int-spec.ts` > "returns an empty page when the term is not contained in any denominación" | COMPLIANT |
| PD-1 Search active products by denominación | Empty term returns empty result | `producto.persistence-adapters.int-spec.ts` > "returns an empty result for empty or whitespace terms"; `producto.service.spec.ts`; `producto.controller.spec.ts` | COMPLIANT |
| PD-2 Exclude inactive products | Soft-deleted product excluded | `producto.persistence-adapters.int-spec.ts` > "excludes soft-deleted products" | COMPLIANT |
| PD-3 Paginated results | First page of ten | `producto.persistence-adapters.int-spec.ts` > "paginates ten rows at a time…" (12 rows -> 10) | COMPLIANT |
| PD-3 Paginated results | Remaining page | same case (second page -> 2) | COMPLIANT |
| PS-1 List active products of a superlínea | Products across multiple líneas returned | `producto.persistence-adapters.int-spec.ts` > "returns products from at least two lineas that belong to the superlinea" | COMPLIANT |
| PS-1 List active products of a superlínea | Superlínea with no products returns empty | `producto.persistence-adapters.int-spec.ts` > "returns an empty result for an unknown superlinea id" + `deletedResult` assertion in "excludes soft-deleted producto, linea and superlinea" | COMPLIANT |
| PS-2 Exclude inactive products | Soft-deleted product excluded | `producto.persistence-adapters.int-spec.ts` > "excludes soft-deleted producto, linea and superlinea" | COMPLIANT |
| PS-3 Paginated results | First page of ten | `producto.persistence-adapters.int-spec.ts` > "paginates the superlinea join ten rows at a time while reporting the full total" (15 rows -> 10) | COMPLIANT |
| PS-3 Paginated results | Remaining page | same case (second page -> 5, total 15) | COMPLIANT |
| LI-1 Search active líneas by denominación | Matching active línea returned | `linea.persistence-adapter.int-spec.ts` > "returns the slim SelectOption shape and matches case-insensitively" | COMPLIANT |
| LI-1 Search active líneas by denominación | Accent mismatch excluded | `linea.persistence-adapter.int-spec.ts` > "is accent-sensitive" | COMPLIANT |
| LI-1 Search active líneas by denominación | No match returns empty result | `linea.persistence-adapter.int-spec.ts` > "returns an empty array when the term is not contained in any denominación" | COMPLIANT |
| LI-1 Search active líneas by denominación | Empty term returns empty result | `linea.persistence-adapter.int-spec.ts` > "returns an empty array for an empty or whitespace term"; `linea.controller.spec.ts` | COMPLIANT |
| LI-2 Exclude inactive líneas | Soft-deleted línea excluded | `linea.persistence-adapter.int-spec.ts` > "excludes soft-deleted lineas" | COMPLIANT |
| LI-3 Slim selection shape | Slim shape returned | `linea.persistence-adapter.int-spec.ts` key-set assertion; `linea.service.spec.ts` > `LineaMapper.toSelectOption` | COMPLIANT |
| SL-1 Search active superlíneas by denominación | Matching active superlínea returned | `superlinea.persistence-adapter.int-spec.ts` > "returns the slim SelectOption shape and matches case-insensitively" | COMPLIANT |
| SL-1 Search active superlíneas by denominación | Accent mismatch excluded | `superlinea.persistence-adapter.int-spec.ts` > "is accent-sensitive" | COMPLIANT |
| SL-1 Search active superlíneas by denominación | No match returns empty result | `superlinea.persistence-adapter.int-spec.ts` > "returns an empty array when the term is not contained in any denominación" | COMPLIANT |
| SL-1 Search active superlíneas by denominación | Empty term returns empty result | `superlinea.persistence-adapter.int-spec.ts` > "returns an empty array for an empty or whitespace term"; `superlinea.controller.spec.ts` | COMPLIANT |
| SL-2 Exclude inactive superlíneas | Soft-deleted superlínea excluded | `superlinea.persistence-adapter.int-spec.ts` > "excludes soft-deleted super lineas" | COMPLIANT |
| SL-3 Slim selection shape | Slim shape returned | `superlinea.persistence-adapter.int-spec.ts` key-set assertion; `superlinea.service.spec.ts` > `SuperLineaMapper.toSelectOption` | COMPLIANT |

**Compliance summary**: 31/31 scenarios fully compliant; 0 PARTIAL; 0 UNTESTED; 0 FAILING.
**Requirement completeness**: 15/15 requirements have every scenario compliant.

**Adversarial check on the new positive-accent cases**: each inserts an accented and an unaccented denominación and searches the *accented* term, asserting the unaccented row is excluded. Under an accent-insensitive query (the old default collation) `harína`/`línea` would match both rows and the `toEqual([...])` assertion would fail; under an over-restrictive query the accented row would be missing and it would also fail. The cases are non-trivial and exercise both directions of PC-3.

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| Partial-coincidence containment matcher | Implemented | `QueryBuilderHelper.applyPartialCoincidence()` emits `LOWER(alias.campo) COLLATE utf8mb4_bin LIKE CONCAT('%', LOWER(:termino), '%') COLLATE utf8mb4_bin` — collation on both sides (`query-builder-helpers.ts` L32-42). |
| Case-insensitive + accent-sensitive | Implemented | Real-MySQL integration tests prove `"harina"` matches `"Harina integral"`, `"harina"` excludes `"harína"`, and `"harína"` matches `"harína premium"` while excluding `"Harina integral"`. |
| Active-only filtering | Implemented | `BasePersistenceAdapter.baseQuery()` applies `deletedAt IS NULL` for línea/superlínea; producto search applies `.where('producto.deletedAt IS NULL')`; the superlínea join adds `producto/linea/superLinea.deletedAt IS NULL` (`producto.persistence-adapters.ts` L490-517). |
| Producto search endpoint | Implemented | `GET /api/producto/search-by-denominacion` -> `ProductoService.busquedaPorCoincidenciaParcial()` -> adapter; no normalization pipe, preserving accent-sensitive pass-through (`producto.controller.ts` L139-159). |
| Products-by-superlínea join | Implemented | `GET /api/producto/search-by-superlinea` filters `superLinea.id = :superLineaId` across `producto -> linea -> superLinea` (`producto.persistence-adapters.ts` L490-517). |
| 10-per-page default | Implemented | `PaginationWithDenominacionDto` (skip 0 / take 10), `SearchProductoSuperlineaDto` (take 10), and service defaults `skip = 0, take = 10`. |
| Slim selection shape | Implemented | `LineaMapper.toSelectOption` / `SuperLineaMapper.toSelectOption` map `id->codigo`, `denominacion->nombre`, `observacion ?? ''->descripcion`; endpoints return the mapped array. |
| Empty/whitespace short-circuit | Implemented | Adapters trim and return empty without touching the DB (`producto.persistence-adapters.ts` L458-461, línea L259-262, superlínea L113-116), matching the design contract. |

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| D1: static helper + thin per-adapter wrapper (no `BasePersistenceAdapter` generic method, no Producto adapter refactor) | Yes | Helper used by all three adapters; Producto still uses raw query builders; no scope expansion. |
| D2: containment expression with `COLLATE utf8mb4_bin` on both sides | Yes | Exact string matches the design contract and the helper spec assertion. |
| D3: no column/table collation change | Yes | No CR-004 migration; `synchronize` untouched. `add-superlinea-to-linea` belongs to CR-003. |
| D4: slim `SelectOption` (`codigo`/`nombre`/`descripcion`) | Yes | `common/interface/select-option.ts` reused; mappers align with `observacion -> descripcion`. |
| Design "File Changes" list | Yes | Every listed file is present in the diff with the expected responsibility. |
| Documented deviations | Yes | `superLineaId` query name, omitted `NormalizeDenominacionSearchPipe` on product search, and adapter-level empty-term short-circuit are recorded in `apply-progress.md` and match the code; none breaks a spec. |

### TDD Compliance (Strict TDD)

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | Yes | "TDD Cycle Evidence" table present in `apply-progress.md` (L48-91) for **all 23 tasks** — Batch 1 (1.1-1.3), Batch 2 (2.1-2.8), Batch 3 (3.1-3.6), Batch 4 (4.1-4.6). W-05 closed. |
| All tasks have tests | Yes | 23/23 tasks map to existing spec files; every CR-004 spec exists in the diff. |
| RED confirmed (tests exist) | Yes | 23 task rows record a RED state (TS2339 missing-method for the units; route-absent 404 for controller routes; failing slim-shape assertions for superlinea). All 9 unit/controller spec files and 3 CR-004 integration specs exist. |
| GREEN confirmed (tests pass) | Yes | Scoped unit 62/62 and integration 30/30 pass on execution now. |
| Triangulation adequate | Yes | Slices 3-4 are now tabulated (3.1 = 3 cases, 3.2 = 2, 3.3 = 6, 3.5 = 3, 4.1 = 3, 4.3 = 6, 4.5 = 3). |
| Safety Net for modified files | Yes | Pre-CR-004 baseline verified by `git show 82beccf:<path>`: `linea.{service,controller}.spec.ts` existed as real specs (green), `superlinea.*.spec.ts` existed but were RED (unresolved DI), and `producto.service.spec.ts` was an 18-line `should be defined` stub with no green baseline. The table now records those actual states instead of "N/A". W-06 closed. |
| REFACTOR | N/A | Subjective; per-task notes present. |

**TDD Compliance**: 6/6 verifiable checks passed (REFACTOR is subjective/informational).

### Test Layer Distribution

| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit (helper, services, mappers) | 34 | 4 | Jest + manual injection / `@nestjs/testing` |
| Integration (controller + validation, in-process) | 28 | 5 | Jest + Supertest + `ValidationPipe` (mocked service) |
| Integration (real persistence) | 30 | 4 | Jest + Testcontainers `mysql:8.0` |
| E2E (browser) | 0 | 0 | Not applicable — `docs/Estrategia_de_Testing.md` §5 mandates manual E2E |
| **Total (CR-004 scope)** | **92** | **13** | |

62 scoped unit/controller tests + 30 persistence integration tests. The strategy's manual E2E allowance applies to the frontend combobox binding, which adds no conditional logic beyond these endpoints (§8).

### Changed File Coverage

Measured from the scoped `test:cov` run (`jest.config.integration.js` sets `collectCoverage: false`, so persistence adapters show as covered by the integration layer, not this table).

| File | Line % | Rating | Note |
|------|--------|--------|------|
| `common/query-builders/query-builder-helpers.ts` | 28.57% (2/7) | Low | Only `applyPartialCoincidence` is exercised by the scoped run; the other public helpers belong to unrelated flows. |
| `producto/application/controllers/producto.controller.ts` | 65.51% (38/58) | Acceptable | New routes covered; pre-existing routes not exercised by the scoped run. |
| `producto/application/services/producto.service.ts` | 30.5% (36/118) | Low | New methods covered; large pre-existing surface outside scope. |
| `producto/dto/search-producto-superlinea.dto.ts` | 100% (10/10) | Excellent | |
| `producto/infraestructure/repositories/producto.persistence-adapters.ts` | 0% (unit) | N/A | Covered by `producto.persistence-adapters.int-spec.ts` (integration). |
| `linea/application/controllers/linea.controller.ts` | 76.92% (30/39) | Acceptable | |
| `linea/application/services/linea.service.ts` | 67.53% (52/77) | Acceptable | |
| `linea/dto/select-linea.dto.ts` | 100% (3/3) | Excellent | |
| `linea/mappers/linea.mapper.ts` | 100% (6/6) | Excellent | |
| `superlinea/application/controllers/superlinea.controller.ts` | 87.5% (28/32) | Excellent | |
| `superlinea/application/services/superlinea.service.ts` | 95.91% (47/49) | Excellent | |
| `superlinea/mappers/superlinea.mapper.ts` | 100% (4/4) | Excellent | |

**Coverage analysis**: not gated; coverage-by-value policy. The relevant new logic (helper + persistence queries + selection mapping) is covered between the helper unit spec and the persistence integration specs.

### Assertion Quality

| File | Line | Assertion | Issue | Severity |
|------|------|-----------|-------|----------|
| `producto/application/services/producto.service.spec.ts` | 76 | `it('returns an empty page when no denominación contains the term (accent mismatch "harína" vs "harina")')` | Test name claims accent behavior but the test mocks the repository to `[]` and asserts delegation only. Real accent coverage now exists in the persistence int-specs, so this is a misleading label, not a coverage gap. | WARNING |
| `common/query-builders/query-builder-helpers.spec.ts` | 11 & 40 | `expect(result).toBe(query)` | Tests 1 and 3 both assert the same chainability contract; redundant. | SUGGESTION |

**Assertion quality**: 0 CRITICAL, 1 WARNING, 1 SUGGESTION. No tautologies, no ghost loops (the `for` loops in the línea/superlínea int-specs are guarded by a preceding `toHaveLength(2)`), no smoke-test-only cases, and no mock-heavy misuse.

### Quality Metrics

**Linter**: Not run — `yarn lint` is configured with `--fix` (mutating); per `AGENTS.md` it is not valid read-only verification.
**Type Checker**: `corepack yarn build` exit 0 — TypeScript/Nest compilation passes with no diagnostics.
**Formatter**: Not run (mutating).

### Issues Found

**CRITICAL**

- None.

**WARNING**

- **W-07 — Repo-wide `corepack yarn test` exits 1 (22 failed suites / 20 failed tests).** All failures are pre-existing and in modules untouched by CR-004; CR-004's scoped unit run (9 suites / 62 tests) and integration run (4 suites / 30 tests) are green. This is a repository condition, not a CR-004 regression, and blocks nothing in this change. *Recommendation*: track repo-wide suite health separately; do not block CR-004 archival on it, but do not claim the full suite is green.
- **W-08 — Misleading test label in `producto.service.spec.ts` L76.** The test is titled as an accent-mismatch case but only asserts repository delegation. The behavior it names is genuinely covered elsewhere (persistence int-specs). *Recommendation*: rename the test to describe delegation, or move the accent assertion reference into a comment.

**SUGGESTION**

- **S-02 — Redundant helper assertions.** `query-builder-helpers.spec.ts` tests 1 and 3 both assert `expect(result).toBe(query)`.
- **S-04 — No-op query parameter.** `GET /producto/search-by-denominacion` reuses `PaginationWithDenominacionDto`, which accepts `incluirEliminados`; the controller destructures only `{denominacion, skip, take}` and the adapter always filters `deletedAt IS NULL`. It is validated (whitelisted) but silently discarded. Not a spec violation (active-only is required), but consider a dedicated DTO to avoid a misleading contract.
- **S-05 — Design open questions not closed in the artifacts.** `design.md` L117-119 lists three open questions; the endpoint and `observacion -> descripcion` mappings are resolved in code, but the HU-2 "products of a selected línea" question is only implicitly served by the pre-existing `findBy` `lineaId` filter and is not recorded. *Recommendation*: annotate the resolution/deferral.
- **S-06 — Pagination fixture diverges from the scenario numbers.** PD-3 uses 12 rows (`10 + 2`) while the scenario text says 15 (`10 + 5`); the 10-per-page behavior is still proven, and PS-3 mirrors the scenario exactly (15 -> 10 + 5).

**Resolved by remediation (previous report's findings)**

- **CR-01 (positive accent direction untested)** — CLOSED. Three real-MySQL cases now assert `harína`/`línea` match their accented denominación and exclude the unaccented one.
- **W-01 (PC-1 term not contained)** — CLOSED. No-match int-spec case in all three adapters.
- **W-02 (PD-1 no match)** — CLOSED. `producto` no-match int-spec case.
- **W-03 (PS-3 join pagination)** — CLOSED. 15 -> 10 + 5 join case.
- **W-04 (LI-1 / SL-1 no match)** — CLOSED. No-match int-spec case in línea and superlínea.
- **W-05 (incomplete TDD evidence table)** — CLOSED. All 23 task rows present.
- **W-06 (misreported safety net)** — CLOSED. Pre-existing suite state recorded per file; baseline confirmed via `git show 82beccf:<path>`.
- **S-01 (evidence count discrepancy)** — CLOSED. `apply-progress.md` now states 5 controller cases, matching the file.

### Verdict

**PASS WITH WARNINGS**

Every previously failing finding is genuinely closed, not rubber-stamped: all 31 spec scenarios and all 15 requirements now have covering tests that passed at runtime, including the previously-unverified positive accent direction and the real-DB no-match and join-pagination cases; all 23 tasks remain complete with a full per-task TDD evidence table; build exits 0 and the change's own suites are green (62 unit/controller plus 30 real-MySQL integration tests). The remaining warnings are non-blocking: the repo-wide `corepack yarn test` still exits 1 on 22 pre-existing, out-of-scope suites, and one test label is misleading. No blockers and no critical findings remain.

## Verification Commands (exact summaries)

| Command | Exit | Summary |
|---------|------|---------|
| `corepack yarn build` | 0 | no output (success) |
| `corepack yarn test <9 CR-004 specs>` | 0 | Test Suites: 9 passed, 9 total; Tests: 62 passed, 62 total |
| `corepack yarn test:integration` | 0 | Test Suites: 4 passed, 4 total; Tests: 30 passed, 30 total |
| `corepack yarn test` (repo-wide, informational) | 1 | Test Suites: 22 failed, 25 passed, 47 total; Tests: 20 failed, 83 passed, 103 total |
| `corepack yarn test:cov -- <9 CR-004 specs>` | 0 | Test Suites: 9 passed; Tests: 62 passed (coverage table above) |

## Key Learnings

1. Re-verification must re-execute the suite; the integration count moving from 23 to 30 was the objective proof that the seven new real-DB cases were added.
2. A positive accent-match test is only meaningful when it also asserts exclusion of the unaccented row, which fails under accent-insensitive collation.
3. Pre-CR-004 safety-net claims can be independently checked with `git show <baseline>:<path>` without checking out the old revision.
