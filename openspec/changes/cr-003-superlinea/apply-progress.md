# Apply Progress: Introduce SuperLínea

## Status

- Mode: Strict TDD
- Delivery: Feature branch chain on `CR-003`
- Completed: 14 of 14 tasks
- Current work unit: PR 3 — Linea Association and Integration

## Completed Tasks

- [x] 1.1 Migration integration specification
- [x] 1.2 Migration and entity relationship implementation
- [x] 1.3 Constraint naming, focused verification, and build
- [x] 2.1 SuperLinea service and HTTP contract tests
- [x] 2.2 Domain contracts, DTOs, mapper, deletion policy, and Linea active-reference query
- [x] 2.3 SuperLinea application, persistence, controller, and module lifecycle
- [x] 2.4 Query refactor and focused verification
- [x] 3.1 Linea service and HTTP association contract tests
- [x] 3.2 Linea DTO and application association behavior
- [x] 3.3 Linea association persistence, joined reads, and reduced mapping
- [x] 3.4 Boundary-only circular module wiring and focused verification
- [x] 4.1 Direct MySQL create, reassignment, and joined-read specification
- [x] 4.2 Application module registration without seeder integration
- [x] 4.3 Cumulative focused, MySQL runtime, build, and diff verification

## TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1 | `src/migrations/add-superlinea-to-linea.spec.ts` | Integration | N/A (new) | Failed to compile because the migration did not exist | 4/4 scenarios passed against MySQL 8 | Populated and empty fixtures plus valid and invalid persistence paths | Test helpers isolate every run in a disposable database |
| 1.2 | `src/migrations/add-superlinea-to-linea.spec.ts` | Integration | N/A (new migration and entity) | Covered by task 1.1 RED | Migration `up` and `down` passed 4/4 scenarios | Duplicate denomination and invalid FK writes were rejected | Explicit names align entity and migration metadata |
| 1.3 | `src/migrations/add-superlinea-to-linea.spec.ts` | Integration | 4/4 after GREEN | Existing RED retained | Focused suite passed | N/A — verification task | `yarn build` passed; no further production refactor was necessary |
| 2.1 | `src/modules/gestion-productos/superlinea/application/{services,controllers}/*.spec.ts` | Unit + HTTP integration | N/A (new files) | Both suites failed to compile because the SuperLinea application contracts did not exist | 17/17 tests passed | All 13 specified scenarios use distinct happy/edge paths; HTTP routing adds create/update/delete/read/search/select coverage | Tests share focused entity and HTTP fixtures |
| 2.2 | Same focused suites | Unit | N/A (new contracts); no existing repository test covers the modified Linea files | Covered by task 2.1 RED before production code | Service policy/contract scenarios passed | Own-denomination versus deleted-record conflict and active versus deleted Linea paths | Denomination query construction is centralized |
| 2.3 | Same focused suites | Unit + HTTP integration | N/A (new lifecycle) | Covered by task 2.1 RED before production code | CRUD, audit delegation, visibility/counts, and deletion behavior passed | Non-empty and empty collections plus default and include-deleted paths | Public mapping and application orchestration remain separate from TypeORM persistence |
| 2.4 | Same focused suites | Unit + HTTP integration | 16/16 passed before final audit hardening | Added cases failed for creation-audit tampering (400 expected / 200 received) and selector without a filter (200 expected / 400 received) | 17/17 tests passed after excluding creation audit fields from updates and accepting an omitted selector filter | Update audit tampering is rejected while legitimate updates and filtered/unfiltered selectors remain accepted | Extracted the shared denomination filter and narrowed update persistence fields |
| 3.1 | `src/modules/gestion-productos/linea/application/{services,controllers}/*.spec.ts` | Unit + HTTP integration | 2/2 baseline tests passed after the separately authorized fixture repair | Controller create omitted-parent returned 201 instead of 400, valid parent returned 400, and service tests did not compile because DTOs lacked `superLineaId` | 10/10 focused tests passed | Missing and soft-deleted parents, omitted versus null updates, valid reassignment, and reduced detail/search/selector responses use distinct paths | Shared repository fixtures keep association behavior explicit |
| 3.2 | Same focused Linea suites | Unit + HTTP integration | Covered by task 3.1 baseline | Covered by task 3.1 RED | Required create and optional non-null update contracts passed; omitted update preserves the parent | Active, missing, and soft-deleted parent lookups were exercised | Parent resolution is centralized in the application service |
| 3.3 | Same focused Linea suites plus `src/migrations/add-superlinea-to-linea.spec.ts` | Unit + MySQL integration | Existing 4/4 migration scenarios remained available | Covered by task 3.1 RED | Persistence and reduced joined reads passed; runtime create/update/read passed on MySQL | Omitted update and explicit reassignment were both verified | Join and mapping changes stay inside persistence and mapper boundaries |
| 3.4 | Same focused Linea suites | Unit + HTTP integration | 10/10 after GREEN | Existing RED retained | 10/10 passed with boundary-only `forwardRef` wiring | N/A — module-boundary verification | No additional production refactor was necessary |
| 4.1 | `src/migrations/add-superlinea-to-linea.spec.ts` | MySQL integration | Existing 4/4 migration scenarios | N/A — authorized scope correction removed an out-of-scope harness without adding production behavior | Direct create, reassignment, and joined read pass after migration | The fifth scenario covers a valid initial association and a different valid reassignment | Removed the temporary seeder harness so the runtime test exercises database integration directly |
| 4.2 | `src/app.module.ts` | Module integration | Existing application build | N/A — scoped registration correction with no new behavior | `SuperLineaModule` remains registered while seed modules stay unchanged | Application registration and runtime seeding are separate boundaries | Seeder production files match their pre-CR-003 content |
| 4.3 | Five focused suites | Unit + HTTP + MySQL integration | 27/27 non-runtime focused tests and prior 4/4 migration tests | Existing RED evidence retained | 5/5 suites and 32/32 tests passed; `yarn build` and `git diff --check` passed | Runtime fixture adds direct create, reassignment, and joined read to the four migration scenarios | No global test command or seeder suite was used |

## Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test | `yarn test --runInBand --runTestsByPath src/migrations/add-superlinea-to-linea.spec.ts` — PASS, 1 suite and 4 tests |
| Runtime harness | MySQL 8 at the configured external host; each test creates and drops isolated database `cr003_migration_<pid>` — PASS for populated `up`, empty `up`, constraints, and `down` |
| Build | `yarn build` — PASS |
| Rollback boundary | Revert the new migration and `SuperLinea` entity, then remove `Linea.superLinea`/`superLineaId`; no management or API behavior is included |

### Work Unit 2 — SuperLinea Management

| Evidence | Result |
|---|---|
| Focused test | `yarn test --runInBand --runTestsByPath src/modules/gestion-productos/superlinea/application/services/superlinea.service.spec.ts src/modules/gestion-productos/superlinea/application/controllers/superlinea.controller.spec.ts` — PASS, 2 suites and 17 tests |
| Runtime harness | The controller suite boots a Nest HTTP application and exercises `/api/superlinea` create, update, delete, detail, audit, search, and selector routes through Supertest — PASS |
| Build | `yarn build` — PASS |
| Diff integrity | `git diff --check` — PASS |
| Rollback boundary | Remove `src/modules/gestion-productos/superlinea/` except the Phase 1 entity, and revert only `existsActiveBySuperLinea` from the Linea repository interface, facade, and adapter; schema foundation remains intact |
| Review budget | 994 authored additions/deletions; the maintainer explicitly accepted `size:exception` for this cohesive Work Unit 2 child review slice |

### Work Unit 3 — Linea Association and Integration

| Evidence | Result |
|---|---|
| Focused tests | `yarn test --runInBand --runTestsByPath` with the migration, SuperLinea, and Linea specs — PASS, 5 suites and 32 tests |
| Runtime harness | External MySQL fixture — PASS, 5 tests covering migration plus direct create/reassignment/joined-read behavior |
| Build | `yarn build` — PASS |
| Diff integrity | `git diff --check` — PASS |
| Rollback boundary | Revert Linea DTO/service/repository/mapper association changes, boundary-only module wiring, `SuperLineaModule` registration, and the fifth direct MySQL runtime scenario; Work Units 1–2 remain intact |
| Review budget | 365 authored implementation/test additions/deletions, excluding accumulated OpenSpec evidence; the corrected Work Unit 3 is within the 400-line budget |

## Deviations and Risks

- MySQL DDL performs implicit commits, so the complete DDL migration cannot be physically atomic even when TypeORM invokes migrations transactionally. The migration keeps the required safe order: nullable column, complete backfill, `NOT NULL`, index, then restrictive foreign key.
- The Supertest HTTP harness needs permission to bind a local ephemeral port; its sandboxed run failed with `EPERM`, and the same focused command passed outside the network sandbox.
- Work Unit 2 exceeds the 400-line review budget because the complete lifecycle and its required 13-scenario tests form one coordinated module; the maintainer explicitly accepted `size:exception` for this slice.
- The previously accepted Work Unit 3 `size:exception` is no longer needed after removing seeder integration; the corrected slice is 365 implementation/test additions/deletions.
- Tasks 4.1–4.2 are correction/integration work without new production behavior, so no new RED phase applies; the original migration and Linea behavior retain their strict-TDD evidence in tasks 1.1 and 3.1.
- The pre-existing `seedLineas()` still creates `Linea` without `superLineaId` and can fail after the non-null migration. This is intentionally unresolved because runtime seeders are outside CR-003 scope.

## Remaining Tasks

- None. Implementation tasks 1.1–4.3 are complete; runtime seeders are explicitly outside the change.
