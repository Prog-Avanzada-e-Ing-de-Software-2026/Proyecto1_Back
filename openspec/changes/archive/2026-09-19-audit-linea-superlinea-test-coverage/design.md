# Design: Audit Línea and SuperLínea Test Coverage

## Context

See `proposal.md` and the delta spec for intent and requirements.

Runner and harness final state after the branch-wide refactor:

- Selection is **manifest-driven**: `jest.config.js` reads `TEST_SUITE` and loads `test/config/without-testcontainers.json` (unit/HTTP) or `test/config/with-testcontainers.json` (`*.int-spec.ts`); a file in neither manifest does not run. There is no `jest.config.integration.js`.
- The `@nestjs/mapped-types` CommonJS shim is mapped in `jest.config.js` `moduleNameMapper` -> `test/harness/nestjs-mapped-types.cjs`.
- Integration uses a **per-file** MySQL 8 Testcontainer (`test/integration/mysql-test-container.ts`, tmpfs datadir, 300s timeout). Each `*.int-spec.ts` starts and stops its own container; `test/integration/test-datasource.ts` provides the initialized `DataSource`, the unit-of-work stub, and truncation; `test/integration/harness-safety.int-spec.ts` guards the lifecycle. Migrations are the real ones and `synchronize: false`.

On this branch (Docker available) `yarn test` is 147 passed / 1 failed and `yarn test:integration` is 82 passed / 1 failed. The single failure in each is the truthful CP-63 production gap: `SuperLineaService` does not pass the current ID to its uniqueness policy, so a self-denomination update is wrongly reported as a conflict. Integration CPs are considered passed because they actually executed green; CP-63 remains RED.

## Goals / Non-Goals

**Goals:** produce traceable CP-47..CP-66 evidence, preserve useful selector/search regressions as non-CP tests, repair only demonstrated harness/runner defects, and provide reproducible focused commands without suppressing full-suite failures.

**Non-Goals:** production code, APIs, schemas, migrations, or changing behavior to make a test pass.

## Decisions

| Decision | Choice and rationale | Alternatives rejected |
|---|---|---|
| Runner boundaries | Manifest-driven selection: `jest.config.js` loads the exact file list from `test/config/*.json` by `TEST_SUITE`. Unit/HTTP and `*.int-spec.ts` stay separated; `yarn test` remains intact. | Jest projects add configuration complexity; arbitrary exclusions hide unrelated failures. |
| Integration config | Single `jest.config.js` with the `@nestjs/mapped-types` CommonJS mapping in `moduleNameMapper` (`test/harness/nestjs-mapped-types.cjs`), `maxWorkers: 1`, and a 240s timeout for the `with` suite. | A separate `jest.config.integration.js` duplicates configuration and diverges from the single source of truth. |
| MySQL harness | Per-file `mysql:8.0` Testcontainer via `test/integration/mysql-test-container.ts`; real migrations, `synchronize: false`, per-test truncation, and serial execution. Each spec owns its container lifecycle and `harness-safety.int-spec.ts` guards it. | A shared global container serializes every spec behind one startup and makes readiness failures global. |
| CP evidence | Extend the lowest valid layer and remove stale CP numbers from selector/search titles, labeling those tests `non-CP regression`. Keep the CP-63 self-update assertion RED/pending because weakening it would misrepresent the authority and fixing production is excluded. | Duplicating every outcome at HTTP and DB levels adds low-value coverage. |

## Test Flow

    focused unit/HTTP paths -> Jest default config -> mocked infrastructure
    focused *.int-spec.ts  -> integration config -> setup -> MySQL 8
                                               -> migrations -> truncate -> assertions -> teardown

## File Changes

| Files | Action |
|---|---|
| `test/config/without-testcontainers.json`, `test/config/with-testcontainers.json` | Manifest selection for unit/HTTP and integration specs. |
| `jest.config.js` | Single config; `TEST_SUITE` selects the manifest; mapped-types CommonJS mapping in `moduleNameMapper`. |
| `test/integration/mysql-test-container.ts` | Per-file MySQL 8 container helper (tmpfs datadir, 300s timeout). |
| `test/integration/test-datasource.ts`, `test/integration/harness-safety.int-spec.ts` | Initialized DataSource, unit-of-work stub, truncation, and lifecycle guard. |
| `linea/application/controllers/linea.controller.spec.ts`, `linea/application/services/linea.service.spec.ts`, `linea/dto/linea.dto.spec.ts`, `linea/infraestructure/repositories/linea.persistence-adapter.int-spec.ts` | Complete CP-48/49/52/53/56 boundaries and correct stale labels. |
| `linea/dto/select-linea.dto.spec.ts` | Relabel selector checks as `No-CP` regressions. |
| `superlinea/application/controllers/superlinea.controller.spec.ts`, `superlinea/application/services/superlinea.service.spec.ts`, `superlinea/dto/superlinea.dto.spec.ts`, `superlinea/infraestructure/repositories/superlinea.persistence-adapter.int-spec.ts` | Add CP-57/59/63/66 gaps, preserve CP-63 RED evidence, and correct stale labels. |

## Verification

```bash
node node_modules/jest/bin/jest.js --runTestsByPath src/modules/gestion-productos/linea/application/controllers/linea.controller.spec.ts src/modules/gestion-productos/linea/application/services/linea.service.spec.ts src/modules/gestion-productos/linea/dto/linea.dto.spec.ts src/modules/gestion-productos/linea/dto/select-linea.dto.spec.ts src/modules/gestion-productos/superlinea/application/controllers/superlinea.controller.spec.ts src/modules/gestion-productos/superlinea/application/services/superlinea.service.spec.ts src/modules/gestion-productos/superlinea/dto/superlinea.dto.spec.ts --runInBand
yarn test
TEST_SUITE=with node node_modules/jest/bin/jest.js --runTestsByPath src/modules/gestion-productos/linea/infraestructure/repositories/linea.persistence-adapter.int-spec.ts src/modules/gestion-productos/superlinea/infraestructure/repositories/superlinea.persistence-adapter.int-spec.ts
yarn test:integration
yarn build
openspec validate audit-linea-superlinea-test-coverage --strict
```

Focused results prove CP scope; full commands expose unrelated regressions. Docker failure, timeout, skip, or setup failure is reported as unavailable/failed, never passed.

## Risks / Rollback

- **Docker readiness remains environmental** -> retain the exact failing result and leave integration CPs unapproved.
- **CP-63 cannot become green in this scope** -> report it pending; do not edit production.
- Roll back the listed test, script, config, and harness edits independently; no data or production rollback is required.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable classification, or process-integration boundary is introduced.
