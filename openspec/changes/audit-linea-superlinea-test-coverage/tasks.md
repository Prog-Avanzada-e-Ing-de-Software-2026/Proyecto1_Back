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
| 1 | Repair runners and lifecycle | Single PR | focused Jest command below | Docker/MySQL integration command below; unavailable remains failed | `package.json`, `jest.config.integration.js`, `test/integration/*` |
| 2 | Complete and relabel CP evidence | Single PR | focused Jest command below | N/A for unit/HTTP; integration specs use Unit 1 harness | Línea/SuperLínea test files only |

## Phase 1: RED Evidence and Runner Foundation

- [ ] 1.1 Record RED baselines for CP-63 and integration readiness (`Port 3306/tcp not bound after 120000ms`); preserve failure/unavailable status. References: `docs/temp/Casos de prueba - Línea y SuperLínea.md` (read-only), `design.md` (read-only).
- [ ] 1.2 Add semantic `test:linea-superlinea` and `test:linea-superlinea:integration` scripts in `package.json`; leave `jest.config.js` (read-only) unchanged.
- [ ] 1.3 Add only the mapped-types CommonJS mapping to `jest.config.integration.js`.
- [ ] 1.4 RED: add/adjust harness assertions exposing missing Presentación migration/entity/table cleanup, partial setup/stop cleanup, stale connection-file handling, and FK-check restoration.

## Phase 2: GREEN Harness and CP Coverage

- [ ] 2.1 GREEN: update `test/integration/global-setup.ts`, `test/integration/global-teardown.ts`, and `test/integration/test-datasource.ts` with migration metadata, deterministic cleanup, `finally` restoration, and failure-safe container/file handling; keep real migrations and `synchronize: false`.
- [ ] 2.2 RED then GREEN: complete Línea CP-48/49/52/53/56 in `src/modules/gestion-productos/linea/application/controllers/linea.controller.spec.ts`, `src/modules/gestion-productos/linea/application/services/linea.service.spec.ts`, and `src/modules/gestion-productos/linea/dto/linea.dto.spec.ts`; correct stale labels.
- [ ] 2.3 RED then GREEN: complete Línea persistence CP-48/49/52/53/56 in `src/modules/gestion-productos/linea/infraestructure/repositories/linea.persistence-adapter.int-spec.ts`, covering association, reassignment, and boundaries.
- [ ] 2.4 RED then GREEN: complete SuperLínea CP-57/59/66 in `src/modules/gestion-productos/superlinea/application/controllers/superlinea.controller.spec.ts`, `src/modules/gestion-productos/superlinea/application/services/superlinea.service.spec.ts`, and `src/modules/gestion-productos/superlinea/dto/superlinea.dto.spec.ts`; preserve CP-63 self-update as RED/pending and do not modify production.
- [ ] 2.5 RED then GREEN: complete SuperLínea persistence CP-57/59/66 in `src/modules/gestion-productos/superlinea/infraestructure/repositories/superlinea.persistence-adapter.int-spec.ts`, covering length, listing, deletion, and deleted detail.
- [ ] 2.6 Relabel selector/search checks in `src/modules/gestion-productos/linea/dto/select-linea.dto.spec.ts` as `non-CP regression` without deleting valid behavior.

## Phase 3: Refactor and Verification

- [ ] 3.1 REFACTOR labels/classification only after green evidence, then run: `node node_modules/jest/bin/jest.js --runTestsByPath src/modules/gestion-productos/linea/application/controllers/linea.controller.spec.ts src/modules/gestion-productos/linea/application/services/linea.service.spec.ts src/modules/gestion-productos/linea/dto/linea.dto.spec.ts src/modules/gestion-productos/superlinea/application/controllers/superlinea.controller.spec.ts src/modules/gestion-productos/superlinea/application/services/superlinea.service.spec.ts src/modules/gestion-productos/superlinea/dto/superlinea.dto.spec.ts --coverage=false --runInBand`.
- [ ] 3.2 Run `yarn test`; run focused integration with `node node_modules/jest/bin/jest.js --config ./jest.config.integration.js --runTestsByPath src/modules/gestion-productos/linea/infraestructure/repositories/linea.persistence-adapter.int-spec.ts src/modules/gestion-productos/superlinea/infraestructure/repositories/superlinea.persistence-adapter.int-spec.ts`; run `yarn test:integration`, `yarn build`, and `openspec validate audit-linea-superlinea-test-coverage --strict`; report every result truthfully.
