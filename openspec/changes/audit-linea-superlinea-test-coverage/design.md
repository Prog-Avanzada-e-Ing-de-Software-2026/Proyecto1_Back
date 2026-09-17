# Design: Audit Línea and SuperLínea Test Coverage

## Context

See `proposal.md` and the delta spec for intent and requirements. The current unit/HTTP runner selects `*.spec.ts`; the integration runner selects `*.int-spec.ts`, uses one MySQL 8 Testcontainer, applies migrations, runs serially, and fails visibly when Docker is unavailable. A focused integration run currently fails during MySQL readiness (`Port 3306/tcp not bound after 120000ms`), so no integration CP is considered passed.

The harness is not fully current: it omits `1789200000000-AddPresentacionToProducto`, the `Presentacion` entity, and its table cleanup. Cleanup also does not guarantee connection-file removal when container stop fails, migration failure does not stop an already-started container, and failed truncation can leave foreign-key checks disabled. The focused unit/HTTP run has 63 passes and one truthful CP-63 failure: `SuperLineaService` does not pass the current ID to its uniqueness policy.

## Goals / Non-Goals

**Goals:** produce traceable CP-47..CP-66 evidence, preserve useful selector/search regressions as non-CP tests, repair only demonstrated harness/runner defects, and provide reproducible focused commands without suppressing full-suite failures.

**Non-Goals:** production code, APIs, schemas, migrations, or changing behavior to make a test pass.

## Decisions

| Decision | Choice and rationale | Alternatives rejected |
|---|---|---|
| Runner boundaries | Leave `jest.config.js` unchanged: its regex already isolates unit/HTTP tests from `*.int-spec.ts`. Add `test:linea-superlinea` and `test:linea-superlinea:integration` scripts with explicit paths; ordinary `yarn test` remains intact. | Jest projects add configuration complexity; arbitrary exclusions hide unrelated failures. |
| Integration config | Keep `testRegex`, `maxWorkers: 1`, timeout, setup, and teardown. Add the existing `@nestjs/mapped-types` CommonJS harness mapping to `jest.config.integration.js`, because v12 is ESM and integration imports update DTOs. | Transforming dependencies or changing production DTO imports broadens scope. |
| MySQL harness | Add the missing migration/entity/table and harden setup, teardown, stale-file cleanup, and `FOREIGN_KEY_CHECKS` restoration with `finally`. Keep one shared `mysql:8.0` container, real migrations, `synchronize: false`, per-test truncation, and serial execution. | Per-test containers are slower; schema synchronization would stop testing real migrations. |
| CP evidence | Extend the lowest valid layer and remove stale CP numbers from selector/search titles, labeling those tests `non-CP regression`. Keep the CP-63 self-update assertion RED/pending because weakening it would misrepresent the authority and fixing production is excluded. | Duplicating every outcome at HTTP and DB levels adds low-value coverage. |

## Test Flow

    focused unit/HTTP paths -> Jest default config -> mocked infrastructure
    focused *.int-spec.ts  -> integration config -> setup -> MySQL 8
                                               -> migrations -> truncate -> assertions -> teardown

## File Changes

| Files | Action |
|---|---|
| `package.json` | Add focused unit/HTTP and integration scripts naming only Línea/SuperLínea CP files. |
| `jest.config.js` | No change; current isolation is correct. |
| `jest.config.integration.js` | Add the mapped-types harness mapping only. |
| `test/integration/global-setup.ts`, `global-teardown.ts`, `test-datasource.ts` | Complete migration metadata and guarantee cleanup/restoration. |
| `linea/application/controllers/linea.controller.spec.ts`, `linea/application/services/linea.service.spec.ts`, `linea/dto/linea.dto.spec.ts`, `linea/infraestructure/repositories/linea.persistence-adapter.int-spec.ts` | Complete CP-48/49/52/53/56 boundaries and correct stale labels. |
| `linea/dto/select-linea.dto.spec.ts` | Relabel selector checks as non-CP regressions. |
| `superlinea/application/controllers/superlinea.controller.spec.ts`, `superlinea/application/services/superlinea.service.spec.ts`, `superlinea/dto/superlinea.dto.spec.ts`, `superlinea/infraestructure/repositories/superlinea.persistence-adapter.int-spec.ts` | Add CP-57/59/63/66 gaps, preserve CP-63 RED evidence, and correct stale labels. |

## Verification

```bash
node node_modules/jest/bin/jest.js --runTestsByPath src/modules/gestion-productos/linea/application/controllers/linea.controller.spec.ts src/modules/gestion-productos/linea/application/services/linea.service.spec.ts src/modules/gestion-productos/linea/dto/linea.dto.spec.ts src/modules/gestion-productos/superlinea/application/controllers/superlinea.controller.spec.ts src/modules/gestion-productos/superlinea/application/services/superlinea.service.spec.ts src/modules/gestion-productos/superlinea/dto/superlinea.dto.spec.ts --coverage=false --runInBand
yarn test
node node_modules/jest/bin/jest.js --config ./jest.config.integration.js --runTestsByPath src/modules/gestion-productos/linea/infraestructure/repositories/linea.persistence-adapter.int-spec.ts src/modules/gestion-productos/superlinea/infraestructure/repositories/superlinea.persistence-adapter.int-spec.ts
yarn test:integration
yarn build
```

Focused results prove CP scope; full commands expose unrelated regressions. Docker failure, timeout, skip, or setup failure is reported as unavailable/failed, never passed.

## Risks / Rollback

- **Docker readiness remains environmental** -> retain the exact failing result and leave integration CPs unapproved.
- **CP-63 cannot become green in this scope** -> report it pending; do not edit production.
- Roll back the listed test, script, config, and harness edits independently; no data or production rollback is required.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable classification, or process-integration boundary is introduced.
