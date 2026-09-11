# Proposal: Introduce SuperLínea

## Intent

Introduce `SuperLinea` as an independent aggregate and require every `Linea` to reference one active `SuperLinea`, preserving modular boundaries, soft deletion, and responsible-user auditing.

## Scope

### In Scope

- Add `SuperLinea` lifecycle, paginated search, and active-only selector queries.
- Reserve each `denominacion` globally, including after soft deletion.
- Record `createdAt`, `updatedAt`, `deletedAt`, `usuarioCreated`, `usuarioUpdated`, and `usuarioDeleted` through the existing audit pattern.
- Require an active `SuperLinea` when creating or reassigning a `Linea`; omission during update preserves the current association, while explicit `null` is rejected.
- Return `superLinea: { id, denominacion }` in `Linea` responses.
- Prevent deletion of a `SuperLinea` only while active `Linea` records reference it.
- Migrate existing lines through the approved provisional `Temporal` super line and enforce a non-null foreign key.

### Out of Scope

- Backend deletion-confirmation protocols.
- Restoration when a `Linea` parent is deleted.
- New pricing, stock, CQRS, or domain-event behavior.

## Capabilities

### New Capabilities

- `superlinea-management`: Lifecycle, queries, visibility, uniqueness, auditing, and deletion protection.
- `linea-superlinea-association`: Required association, update semantics, reduced responses, persistence, and migration.

### Modified Capabilities

None; `openspec/specs/` contains no existing capability specifications.

## Approach

Create a dedicated NestJS module following existing boundaries. Coordinate aggregates through application services and repository-backed domain policies. Enforce `UNIQUE (denominacion)` in MySQL. Migrate in stages: create `super_linea`, add a nullable relation, assign `Temporal`, then enforce `NOT NULL` and referential integrity.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/modules/gestion-productos/superlinea/` | New | Aggregate, API, persistence, and tests |
| `src/modules/gestion-productos/linea/` | Modified | Required association and public contract |
| `src/modules/common/seed/seedFamiliaProducto/` | Modified | Super-line-first seed ordering |
| `src/migrations/` | New | Table, backfill, constraint, and indexes |
| `src/app.module.ts` | Modified | Module registration |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Existing rows violate the new invariant | Medium | Transactional migration with verified `Temporal` backfill |
| Concurrent requests bypass application uniqueness checks | Medium | Database-level unique constraint |
| Deleted parent invalidates line restoration | Medium | Specify restoration separately before implementing it |

## Rollback Plan

Revert API/module wiring, then run a down migration removing the foreign key and table only after preserving required production data.

## Dependencies

- Approved provisional denomination: `Temporal`.

## Success Criteria

- [ ] Every persisted and returned `Linea` has one active `SuperLinea` association.
- [ ] Lifecycle, visibility, uniqueness, auditing, and deletion rules pass strict TDD coverage.
- [ ] The migration assigns every existing line to `Temporal` and enforces the final database constraints.
- [ ] `yarn build` and relevant migration verification succeed.
