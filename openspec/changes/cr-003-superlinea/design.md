# Design: Introduce SuperLínea

## Technical Approach

Add `SuperLinea` as a dedicated NestJS module with the repository-token layering already used by `Linea` and `Marca`. `Linea` gains a required TypeORM many-to-one relation. Application services resolve an active parent before writes, mappers shape public responses, and repository-backed policies coordinate cross-aggregate deletion checks. A staged MySQL migration makes existing data valid before enforcing `NOT NULL`.

## Architecture Decisions

| Decision | Alternatives and tradeoff | Rationale |
|---|---|---|
| Dedicated `superlinea` module | Nesting it in `linea` reduces wiring but couples independent lifecycles. | Preserves the repository's domain/application/infrastructure boundaries and the approved aggregate separation. |
| Resolve associations in `LineaService` through `ISuperLineaRepository` | Accepting an ID in persistence is simpler but can attach a missing/deleted parent. | Keeps validation in orchestration and TypeORM access in infrastructure. |
| Use `ManyToOne`/`OneToMany`, `super_linea_id NOT NULL`, and `ON DELETE RESTRICT` | Nullable or cascading relations weaken history and the mandatory invariant. | Soft deletion remains an application action; the FK prevents invalid physical states. |
| Enforce `UNIQUE (denominacion)` and also check with deleted rows | `UNIQUE (denominacion, deletedAt)` permits duplicate `NULL` values in MySQL. | Preserves the denomination across active and deleted records and covers races. |
| Use `forwardRef` only at the module boundary | Querying `linea` directly from the super-line adapter avoids a cycle but crosses repository ownership. | `Linea` needs parent lookup; the deletion policy needs `ILineaRepository.existsActiveBySuperLinea`. This follows the existing product-family module pattern. |

## Data Flow

```text
LineaController -> LineaService -> ISuperLineaRepository (active lookup)
                              -> ILineaRepository (save with parent)

SuperLineaController -> SuperLineaService -> deletion policy
                                        -> ILineaRepository (active lines only)
                                        -> ISuperLineaRepository (soft delete)

Linea query -> join superLinea -> LineaMapper -> { superLinea: { id, denominacion } }
```

## File Changes

| Path | Action | Responsibility |
|---|---|---|
| `src/modules/gestion-productos/superlinea/domain/{entities,interfaces,services}/` | Create | `SuperLinea`, `ISuperLineaRepository`, and active-line deletion policy. |
| `src/modules/gestion-productos/superlinea/{application,dto,mappers,infraestructure}/` | Create | Authenticated CRUD, audit, search, selector, validation, mapping, and TypeORM persistence. |
| `src/modules/gestion-productos/superlinea/superlinea.module.ts` | Create | Entity, token, unit-of-work, user, and line wiring. |
| `src/modules/gestion-productos/linea/domain/entities/linea.entity.ts` | Modify | Required `superLinea` relation and `super_linea_id` join column. |
| `src/modules/gestion-productos/linea/{dto,mappers,application/services,domain/interfaces,infraestructure/repositories}/` | Modify | Write contract, active-parent resolution, joined reads, reduced mapping, and active-reference query. |
| `src/modules/gestion-productos/linea/linea.module.ts`, `src/app.module.ts` | Modify | Export/import repository tokens and register the new module. |
| `src/migrations/<timestamp>-AddSuperLineaToLinea.ts` | Create | Schema, backfill, constraints, indexes, and reversible down path. |
| `src/modules/gestion-productos/{superlinea,linea}/**/*.spec.ts` | Create/Modify | Focused behavior tests derived from all scenarios. |

## Interfaces / Contracts

- `SuperLinea`: generated numeric `id`, required `denominacion`, optional `observacion`, timestamps, and nullable responsible-user ID columns following `Linea`/`Marca` audit persistence.
- API under `/superlinea`: create, detail, update, delete, audit, `search-by`, and active-only `select`; collections return `{ data, total }`.
- `CreateLineaDto.superLineaId` is required and integer. `UpdateLineaDto.superLineaId` is optional only when `undefined`; validation must reject explicit `null` rather than using `IsOptional`, which accepts it.
- Every detail, search, and selector `LineaDto` contains `superLinea: { id, denominacion }`.

## Testing Strategy

Strict RED-GREEN-REFACTOR applies to focused service/controller/repository behavior: uniqueness including deleted rows, audit assignment, visibility/counts, empty collections, deletion blocking by active lines only, required/update association semantics, joins, and reduced mapping. Verify migration `up` on populated and empty `linea` tables, constraints, `down`, and direct MySQL create/reassignment/joined-read behavior; finish with `yarn build`. Runtime seeders remain outside this change. Global `yarn test` and test-infrastructure repair are not CR-003 acceptance gates.

## Threat Matrix

N/A — no routing engine, shell, subprocess, VCS/PR automation, executable classification, or process-integration boundary is introduced.

## Migration / Rollout

In one migration transaction: create `super_linea`; create or resolve active `Temporal` (migration-created audit user may remain null under existing nullable audit columns); add nullable `linea.super_linea_id`; backfill all lines; assert no nulls; change to `NOT NULL`; add index and restrictive FK. Deploy schema before code. Roll back code first; preserve/export associations if needed, then drop FK, column, and table in `down`.

## Open Questions

None.
