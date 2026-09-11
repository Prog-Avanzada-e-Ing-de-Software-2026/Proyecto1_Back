# Tasks: Introduce SuperLínea

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 900–1,300 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 migration/model → PR 2 SuperLinea lifecycle → PR 3 Linea integration |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Establish schema and entities | PR 1 | `yarn test --runInBand --runTestsByPath src/migrations/add-superlinea-to-linea.spec.ts` | Apply/revert against empty and populated MySQL 8 fixtures | New migration and entity relation |
| 2 | Deliver SuperLinea lifecycle | PR 2 | `yarn test --runInBand --runTestsByPath src/modules/gestion-productos/superlinea/application/services/superlinea.service.spec.ts src/modules/gestion-productos/superlinea/application/controllers/superlinea.controller.spec.ts` | Authenticated `/api/superlinea` CRUD/search/select smoke flow | SuperLinea module and Linea active-reference query |
| 3 | Enforce Linea association | PR 3 | `yarn test --runInBand --runTestsByPath src/modules/gestion-productos/linea/application/services/linea.service.spec.ts src/modules/gestion-productos/linea/application/controllers/linea.controller.spec.ts` | Create/update/read Linea plus seed against migrated MySQL 8 | Linea contract, repository joins, and seed changes |

## Phase 1: Schema Foundation

- [ ] 1.1 **RED:** Create `src/migrations/add-superlinea-to-linea.spec.ts` proving populated/empty backfill, active `Temporal`, non-null/restrictive FK, uniqueness, invalid-reference rejection, and reversible `down` (persistent relationship and migration: 4 scenarios).
- [ ] 1.2 **GREEN:** Create `src/migrations/1789091969000-AddSuperLineaToLinea.ts` and `src/modules/gestion-productos/superlinea/domain/entities/superlinea.entity.ts`; update `src/modules/gestion-productos/linea/domain/entities/linea.entity.ts` with the required relation.
- [ ] 1.3 **REFACTOR:** Name indexes/constraints clearly, keep staged backfill transactional, rerun the migration spec, and run `yarn build`.

## Phase 2: SuperLinea Management

- [ ] 2.1 **RED:** Create `src/modules/gestion-productos/superlinea/application/services/superlinea.service.spec.ts` and `src/modules/gestion-productos/superlinea/application/controllers/superlinea.controller.spec.ts` covering all 13 scenarios: attributes/uniqueness (4), audit (3), collections (4), and deletion (2).
- [ ] 2.2 **GREEN:** Implement SuperLinea contracts, policy, DTOs, and mapper; add `existsActiveBySuperLinea` to `src/modules/gestion-productos/linea/domain/interfaces/linea.repository.interface.ts`, `src/modules/gestion-productos/linea/infraestructure/repositories/linea.repository.ts`, and `src/modules/gestion-productos/linea/infraestructure/repositories/linea.persistence-adapter.ts`, exporting the token from `src/modules/gestion-productos/linea/linea.module.ts`.
- [ ] 2.3 **GREEN:** Implement SuperLinea CRUD, audit, search, selector, and persistence; wire `src/modules/gestion-productos/superlinea/superlinea.module.ts` to `src/modules/gestion-productos/linea/linea.module.ts` for deletion checks.
- [ ] 2.4 **REFACTOR:** Remove duplicated normalization/query logic and rerun both focused SuperLinea suites.

## Phase 3: Linea Association

- [ ] 3.1 **RED:** Extend `src/modules/gestion-productos/linea/application/services/linea.service.spec.ts` and `src/modules/gestion-productos/linea/application/controllers/linea.controller.spec.ts` for all 8 create/update/reduced-response scenarios, including omitted versus null updates and deleted-parent rejection.
- [ ] 3.2 **GREEN:** Update `src/modules/gestion-productos/linea/dto/` and `src/modules/gestion-productos/linea/application/services/linea.service.ts` to require an active parent on create/reassignment and preserve it only when omitted on update.
- [ ] 3.3 **GREEN:** Update `src/modules/gestion-productos/linea/infraestructure/repositories/` and `src/modules/gestion-productos/linea/mappers/linea.mapper.ts` for association persistence, joined reads, and reduced mapping.
- [ ] 3.4 **REFACTOR:** Add the opposite parent-lookup dependency from `src/modules/gestion-productos/linea/linea.module.ts` to `src/modules/gestion-productos/superlinea/superlinea.module.ts` using boundary-only `forwardRef`; rerun focused suites.

## Phase 4: Seed and Verification

- [ ] 4.1 **RED:** Create `src/modules/common/seed/seedFamiliaProducto/seed-familia-producto.service.spec.ts` proving `Temporal` is resolved/created before every seeded Linea.
- [ ] 4.2 **GREEN:** Update `src/modules/common/seed/seedFamiliaProducto/seed-familia-producto.service.ts`, `src/modules/common/seed/seedFamiliaProducto/seed-familia-producto.module.ts`, and `src/app.module.ts` to register SuperLinea and seed associations.
- [ ] 4.3 **REFACTOR:** Run all focused suites above, both MySQL migration fixtures, and `yarn build`; do not use global `yarn test` or repair test infrastructure as CR-003 gates.
