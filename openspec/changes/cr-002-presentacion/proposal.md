# Proposal: Introduce Presentación

## Intent

Introduce `Presentacion` as an independent aggregate and require every `Producto` to reference one active `Presentacion`, preserving modular boundaries, soft deletion, and responsible-user auditing. This unlocks CR-005 (denominación automática).

## Scope

### In Scope

- Add `Presentacion` lifecycle, paginated search, and active-only selector queries.
- Reserve each `denominacion` globally, including after soft deletion.
- Define a system-generated numeric `id`, optional string `observacion`, and record `createdAt`, `updatedAt`, `deletedAt`, `usuarioCreated`, `usuarioUpdated`, and `usuarioDeleted` through the verified `Linea`/`Marca`/`SuperLinea` audit pattern.
- Require an active `Presentacion` when creating or reassigning a `Producto`; omission during update preserves the current association, while explicit `null` is rejected.
- Return `presentacion: { id, denominacion }` in `Producto` responses.
- Prevent deletion of a `Presentacion` only while active `Producto` records reference it.
- Migrate existing products through the approved provisional `Temporal` presentation and enforce a non-null foreign key.

### Out of Scope

- Backend deletion-confirmation protocols (UI concern).
- Automatic denomination generation (CR-005).
- Unifying `utilizaPack` / `cantidadPorPack` with `Presentacion`.
- Restoration when a `Producto` parent is deleted.
- New pricing, stock, CQRS, or domain-event infrastructure beyond what Producto already has.
- Runtime seeder integration for `Presentacion`; existing seeders remain unchanged unless required for NOT NULL integrity.

## Capabilities

### New Capabilities

- `presentacion-management`: Lifecycle, queries, visibility, uniqueness, auditing, and deletion protection.
- `producto-presentacion-association`: Required association, update semantics, reduced responses, persistence, and migration.

### Modified Capabilities

None; `openspec/specs/` contains no existing capability specifications for this change.

## Approach

Create a dedicated NestJS module following the `superlinea` boundaries. Coordinate aggregates through application services and repository-backed domain policies. Enforce `UNIQUE (denominacion)` in MySQL. Migrate in stages: create `presentacion`, add a nullable relation on `producto`, assign `Temporal`, then enforce `NOT NULL` and referential integrity.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/modules/gestion-productos/presentacion/` | New | Aggregate, API, persistence, and tests |
| `src/modules/gestion-productos/producto/` | Modified | Required association and public contract |
| `src/migrations/` | New | Table, backfill, constraint, and indexes |
| `src/app.module.ts` | Modified | Module registration |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Existing products violate the new invariant | Medium | Transactional migration with verified `Temporal` backfill |
| Concurrent requests bypass application uniqueness checks | Medium | Database-level unique constraint |
| Confusion with `utilizaPack` / `cantidadPorPack` | Medium | Document as conscious technical debt; leave fields untouched |
| CR-005 blocked until association exists | Low | Deliver association before denomination generation |

## Rollback Plan

Revert API/module wiring, then run a down migration removing the foreign key and table only after preserving required production data.

## Dependencies

- Approved provisional denomination: `Temporal`.
- Base branch: `develop` (includes CR-003 SuperLínea).

## Success Criteria

- [ ] Every persisted and returned `Producto` has one active `Presentacion` association.
- [ ] Lifecycle, visibility, uniqueness, auditing, and deletion rules pass strict TDD coverage.
- [ ] The migration assigns every existing product to `Temporal` and enforces the final database constraints.
- [ ] `yarn build` and relevant migration verification succeed.
