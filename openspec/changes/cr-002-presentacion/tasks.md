# Tasks: Introduce Presentación

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 900–1,400 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 base `CR-002`; PR 2 base PR 1; PR 3 base PR 2; Front follow-up |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

Tested child work accumulates into `CR-002`; no partial work merges to `develop` until the feature branch is ready. User manually opens final `CR-002` → `develop` PR only after implementation.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Rollback boundary |
|---|---|---|---|---|
| 1 | Establish schema and entities | PR 1 | `yarn test --runInBand --runTestsByPath src/migrations/add-presentacion-to-producto.spec.ts` | New migration and entity relation |
| 2 | Deliver Presentacion lifecycle | PR 2 | focused presentacion service/controller specs | Presentacion module |
| 3 | Enforce Producto association | PR 3 | focused producto service/controller specs | Producto contract and joins |
| 4 | Frontend ABMC + selector | Front PR | manual + checklist | Front-only |

## Phase 1: Schema Foundation

- [x] 1.1 **RED:** Create `src/migrations/add-presentacion-to-producto.spec.ts` proving populated/empty backfill, active `Temporal`, non-null/restrictive FK, uniqueness, invalid-reference rejection, and reversible `down`.
- [x] 1.2 **GREEN:** Create migration + `presentacion.entity.ts`; update `producto.entity.ts` with the required relation.
- [x] 1.3 **REFACTOR:** Name indexes/constraints clearly, keep staged backfill transactional, rerun the migration spec, and run `yarn build`.

## Phase 2: Presentacion Management

- [x] 2.1 **RED:** Create presentacion service/controller specs covering attributes/uniqueness, audit, collections, and deletion.
- [x] 2.2 **GREEN:** Implement Presentacion contracts, policies, DTOs, mapper, persistence, and module wiring.
- [x] 2.3 **GREEN:** Implement CRUD, audit, search, selector; add `existsActiveByPresentacion` on producto repository.
- [x] 2.4 **REFACTOR:** Remove duplicated normalization/query logic and rerun focused suites.

## Phase 3: Producto Association

- [x] 3.1 **RED:** Extend producto service/controller specs for create/update/reduced-response scenarios.
- [x] 3.2 **GREEN:** Update producto DTOs and service to require an active parent on create/reassignment.
- [x] 3.3 **GREEN:** Update producto repositories and mapper for association persistence, joined reads, and reduced mapping.
- [x] 3.4 **REFACTOR:** Wire module `forwardRef` boundaries; register in `app.module.ts`; rerun focused suites + `yarn build`.

## Phase 4: Verification

- [ ] 4.1 **INTEGRATION:** Extend migration spec with create/reassign/joined-read coverage after migration.
- [ ] 4.2 Document conscious debt: `utilizaPack` / `cantidadPorPack` overlap left untouched.
- [ ] 4.3 Do not use global `yarn test` as CR-002 gate.
