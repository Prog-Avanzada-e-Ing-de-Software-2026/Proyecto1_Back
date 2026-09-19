# Tasks: Correct Línea and SuperLínea Test Coverage

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 320–390 authored lines |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR: harness/scripts, then CP evidence |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Repair runners and lifecycle | Single PR | focused Jest command below | Docker/MySQL integration command below; unavailable remains failed | `package.json`, `test/config/*.json`, `test/integration/*` |
| 2 | Complete and relabel CP evidence | Single PR | focused Jest command below | N/A for unit/HTTP; integration specs use Unit 1 harness | Línea/SuperLínea test files only |

## Reconciliation With the Testcontainers/Manifest Refactor

The planned runner/harness items (1.2, 1.3, 1.4, 2.1) were superseded by the
branch-wide refactor already merged into this branch (`e7a13ad`, `5fa5a71`,
`b5170d0`, `1d191fa`, `b9fc5a8`, `08dc7b1`). Final state as implemented:

- Test selection is **manifest-driven**: `jest.config.js` reads `TEST_SUITE` and loads
  `test/config/without-testcontainers.json` (unit/HTTP) or
  `test/config/with-testcontainers.json` (`*.int-spec.ts`). A file in neither manifest
  does not run.
- There is **no `jest.config.integration.js`** and no `test:linea-superlinea*` scripts;
  the semantic selection lives in the two manifests.
- The `@nestjs/mapped-types` CommonJS shim is mapped in `jest.config.js`
  `moduleNameMapper` -> `test/harness/nestjs-mapped-types.cjs`.
- The shared global setup/teardown was replaced by a **per-file container helper**
  `test/integration/mysql-test-container.ts` (`mysql:8.0`, tmpfs datadir, root/testpass,
  300s timeout); each `*.int-spec.ts` starts and stops its own container.
  `test/integration/test-datasource.ts` still provides the initialized `DataSource`,
  the unit-of-work stub, and table truncation. `harness-safety.int-spec.ts` guards the
  lifecycle.
- All Testcontainers-using specs were migrated to the per-file helper and registered in
  the `with` manifest.

Observed baseline on this branch (Docker available):

- `yarn test`: 147 passed, 1 failed (CP-63, intentional production gap).
- `yarn test:integration`: 82 passed, 1 failed (CP-63, intentional production gap).

## Phase 1: RED Evidence and Runner Foundation

- [x] 1.1 Recorded RED baselines. The original `Port 3306/tcp not bound after 120000ms`
  baseline was produced by the pre-refactor harness; after the per-file refactor the
  suite starts in seconds and the only remaining RED is the CP-63 production gap.
  References: `docs/temp/Casos de prueba - Línea y SuperLínea.md` (read-only).
- [x] 1.2 Superseded: semantic selection is the manifest pair
  (`test/config/without-testcontainers.json`, `test/config/with-testcontainers.json`)
  instead of `test:linea-superlinea*` scripts; `jest.config.js` is the single config.
- [x] 1.3 Superseded: the mapped-types CommonJS mapping lives in `jest.config.js`
  `moduleNameMapper`; `jest.config.integration.js` no longer exists.
- [x] 1.4 Superseded/closed: harness assertions moved to the per-file helper and are
  exercised by `test/integration/harness-safety.int-spec.ts`, which passes.

## Phase 2: GREEN Harness and CP Coverage

- [x] 2.1 Superseded/closed: the shared global setup/teardown was replaced by
  `test/integration/mysql-test-container.ts`; every migrated `*.int-spec.ts` starts,
  truncates, and stops its own container, with real migrations and `synchronize: false`.
- [x] 2.2 Línea CP-48/49/52/53/56 completed in the controller, service, and DTO specs.
- [x] 2.3 Línea persistence CP-48/49/52/53/56 completed in
  `linea.persistence-adapter.int-spec.ts` (association, reassignment, boundaries).
  Verified green on this branch against real MySQL.
- [x] 2.4 SuperLínea CP-57/59/66 completed in the controller, service, and DTO specs.
  - [ ] CP-63 self-update assertion remains RED/pending (production gap;
    `checkDenominacionExists` is called with one argument, not the current ID).
    Deferred to a separate branch; production is intentionally not modified here.
- [x] 2.5 SuperLínea persistence CP-57/59/66 completed in
  `superlinea.persistence-adapter.int-spec.ts` (length, listing, deletion, deleted
  detail; CP-59 case/accent reservation). Verified green except the intentional CP-63
  RED assertion.
- [x] 2.6 Selector/search checks relabeled `No-CP` in `select-linea.dto.spec.ts` and the
  controller/integration specs without deleting valid behavior.
- [x] 2.7 Normalized every test description in the nine Línea/SuperLínea test files to
  Spanish with the `CP-XX - <descripción>` / `No-CP - <descripción>` convention. Only
  description strings changed.

## Phase 3: Refactor and Verification

- [x] 3.1 REFACTOR labels only; focused unit run:
  `node node_modules/jest/bin/jest.js --runTestsByPath src/modules/gestion-productos/linea/application/controllers/linea.controller.spec.ts src/modules/gestion-productos/linea/application/services/linea.service.spec.ts src/modules/gestion-productos/linea/dto/linea.dto.spec.ts src/modules/gestion-productos/linea/dto/select-linea.dto.spec.ts src/modules/gestion-productos/superlinea/application/controllers/superlinea.controller.spec.ts src/modules/gestion-productos/superlinea/application/services/superlinea.service.spec.ts src/modules/gestion-productos/superlinea/dto/superlinea.dto.spec.ts --runInBand`
  Result: 66 passed, 1 failed (CP-63).
- [x] 3.2 Final verification run and observed:
  - `yarn test`: 147 passed, 1 failed (CP-63).
  - `yarn test:integration`: 82 passed, 1 failed (CP-63).
  - `yarn build`: passes.
  - `openspec validate audit-linea-superlinea-test-coverage --strict`: valid.
  Focused integration command:
  `TEST_SUITE=with node node_modules/jest/bin/jest.js --runTestsByPath src/modules/gestion-productos/linea/infraestructure/repositories/linea.persistence-adapter.int-spec.ts src/modules/gestion-productos/superlinea/infraestructure/repositories/superlinea.persistence-adapter.int-spec.ts`
  Result: 29 passed, 1 failed (CP-63).
