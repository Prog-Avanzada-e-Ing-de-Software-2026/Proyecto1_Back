## Exploration: CR-003 Superlinea

### Current State

`Linea` is an independent TypeORM entity and NestJS module with soft deletion, audit identifiers, denomination lookup, and product-deletion protection. Its application service currently performs denomination uniqueness checks directly, while a domain policy queries `IProductoRepository` before deletion. `Linea` has no parent category, and its create/update DTOs, mapper, repository contract, persistence adapter, controller responses, and seed data contain no higher-level association. `Producto` references `Linea` through a nullable foreign key.

CR-003 introduces `SuperLinea` as a separate aggregate root with its own lifecycle and requires every `Linea` to reference exactly one active `SuperLinea`. The project has no main specifications under `openspec/specs/`, so the change specs must establish both the new aggregate contract and the modified `Linea` contract. Schema synchronization is disabled and the database currently has an initial TypeORM migration only; adding a required relationship therefore needs a new migration and an explicit backfill strategy for existing `linea` rows.

Existing `Linea` tests are only dependency-incomplete construction smoke tests, and the comparable `MarcaService` behavior tests are commented out. The workspace requires strict RED-GREEN-REFACTOR, so CR-003 needs substantive service, controller, policy, persistence, and migration-focused verification rather than copying the current test scaffolds.

### Affected Areas

- `src/modules/gestion-productos/superlinea/` — new aggregate module, entity, DTOs, controller, application service, repository contract/adapters, mapper, and domain policies.
- `src/modules/gestion-productos/linea/domain/entities/linea.entity.ts` — required many-to-one association with `SuperLinea` and inverse collection support.
- `src/modules/gestion-productos/linea/dto/` — required association input and association data in public responses.
- `src/modules/gestion-productos/linea/application/services/linea.service.ts` — resolve and validate an active `SuperLinea` during registration and modification.
- `src/modules/gestion-productos/linea/domain/interfaces/linea.repository.interface.ts` — persistence contract for storing the resolved association and checking active associations.
- `src/modules/gestion-productos/linea/infraestructure/repositories/` — relation persistence and relation-aware queries using the repository's established spelling.
- `src/modules/gestion-productos/linea/mappers/linea.mapper.ts` — expose the associated `SuperLinea` without leaking TypeORM entities.
- `src/app.module.ts` — register the new NestJS module.
- `src/modules/common/seed/seedFamiliaProducto/` — create or resolve `SuperLinea` records before seeding mandatory `Linea` associations.
- `src/migrations/` — create the `super_linea` table, add and backfill the `linea` foreign key, then enforce nullability and referential integrity.
- `src/modules/gestion-productos/{superlinea,linea}/**/*.spec.ts` — strict-TDD coverage for new behavior and modified line registration/update behavior.
- `docs/Analisis_de_Dominio.md` — later domain-document alignment; its current ubiquitous-language glossary only defines `Linea` as the product category.

### Approaches

1. **Separate aggregate module with an explicit relation** — implement `SuperLinea` as a peer of `Linea` and `Marca`, store a non-null foreign key on `Linea`, and coordinate cross-aggregate checks in application services backed by focused domain policies.
   - Pros: Matches CR-003 aggregate boundaries, current NestJS modular structure, TypeORM conventions, soft deletion, and repository-token wiring; keeps database access out of entities.
   - Cons: Requires coordinated module wiring, DTO/API changes, seed changes, and a safe data migration; circular dependencies must be avoided by querying through repository contracts where possible.
   - Effort: High

2. **Nest `SuperLinea` inside the existing `Linea` module** — add the entity and CRUD behavior under the current line module and reuse `LineaService` and its repository layer.
   - Pros: Fewer modules and less initial wiring.
   - Cons: Contradicts the explicitly independent aggregate lifecycle, combines two repository responsibilities, increases service coupling, and makes later evolution and deletion-policy testing harder.
   - Effort: Medium

### Recommendation

Use a dedicated `superlinea` module and preserve the existing `domain`, `application`, `infraestructure`, `dto`, and mapper boundaries. Model `Linea -> SuperLinea` as a required many-to-one relation and `SuperLinea -> Linea` as its inverse navigation only; aggregate independence means the `SuperLinea` aggregate must not own or mutate `Linea` state directly. Resolve the referenced active `SuperLinea` before creating or updating a line, and pass the resolved entity to persistence instead of letting the adapter silently accept an unchecked identifier.

Implement denomination uniqueness and deletion protection as explicit domain policies backed by repository contracts, with a database constraint as race-condition protection rather than the sole business check. Follow the established soft-delete and audit pattern, and ensure association lookups exclude deleted `SuperLinea` records. The delete policy should check associations through `ILineaRepository`; the exact treatment of soft-deleted lines remains a business decision.

Use a staged migration: create `super_linea`, add a nullable foreign key, backfill every existing line according to an approved business mapping, and only then change the column to `NOT NULL`. Do not invent a default category or leave the production invariant enforced only in TypeScript. Update seed ordering and fixtures so they create super lines before lines.

### Risks

- No approved mapping exists for current `linea` rows. A mandatory foreign key cannot be safely deployed until the owner decides whether to provide a mapping or authorize a named fallback `SuperLinea`.
- CR-003 does not state whether a soft-deleted line should continue blocking deletion of its `SuperLinea`; this changes both repository queries and future restoration semantics.
- The request does not clarify whether a deleted `SuperLinea` denomination may be reused. Comparable modules currently reject names found through `withDeleted()`, but their composite database indexes do not reliably enforce the same rule for active rows in MySQL.
- The modified update story does not say whether every update request must carry `superLineaId` or whether omission preserves the already-valid association.
- The consultation story does not define pagination, deleted-record visibility, association shape in `LineaDto`, or whether the backend must return a special empty-result message instead of an empty collection.
- The requested delete confirmation is a client interaction; the backend can authorize and execute deletion but cannot itself display or require a UI confirmation without an explicit confirmation-token contract.
- Current service tests do not provide usable coverage patterns and may fail construction because required dependencies are not mocked; strict TDD will require replacing the scaffolds with behavior-focused tests.
- The package migration scripts invoke `npm` internally despite the repository-wide Yarn rule, so the implementation plan must use a verified Yarn-compatible TypeORM invocation rather than copying those scripts blindly.

### Confirmed Decisions

- Existing `Linea` records will be migrated by creating and assigning an active provisional `SuperLinea` with the denomination `Temporal`.
- `Linea` updates will follow the existing `Producto` update semantics: an omitted `superLineaId` preserves the current association, an explicit `null` is rejected because the relationship is mandatory, and a provided identifier replaces the association only after resolving an active `SuperLinea`. `docs/Analisis_de_Dominio.md` does not define or contradict this behavior.
- `Linea` read responses will expose the mandatory association as `superLinea: { id, denominacion }` through the existing reduced-reference DTO pattern used by `Producto`; they will not expose only `superLineaId` or serialize the complete related entity.
- SuperLinea collection queries with no matches will return the stable success shape `{ data: [], total: 0 }`; contextual empty-state guidance belongs to the frontend rather than replacing the collection contract with a message or error.
- SuperLinea queries will follow the existing Linea read pattern within gestion-productos: a paginated search endpoint plus a selector-oriented listing.
- SuperLinea paginated search will default to active records and accept `incluirEliminados=true` to return both active and soft-deleted records; the selector will always return active records only. Unlike the current Linea selector defect, its `total` will reflect the actual result count.
- Deletion confirmation is a frontend responsibility. The backend will execute the deletion policy when it receives the authorized `DELETE` request, following the existing Linea interaction model; no confirmation token or two-step backend protocol will be introduced.
- Future CR-003 comparisons and precedents will be limited to `src/modules/gestion-productos` unless authoritative domain documentation provides an explicit rule.

### Pending Domain Decisions

- The domain owner must determine whether a soft-deleted `Linea` continues to block deletion of its associated `SuperLinea`. This affects deletion policy queries and future restoration behavior.
- The domain owner must determine whether the denomination of a soft-deleted `SuperLinea` remains reserved or may be reused. Existing modules implement contradictory policies, so CR-003 cannot safely inherit a project-wide convention.

### Ready for Proposal

No. All explored technical contracts are confirmed, including migration, update omission, response shape, query behavior, visibility, and frontend-owned deletion confirmation. Proposal work remains blocked only by the two explicit domain-owner decisions: whether soft-deleted Linea records block SuperLinea deletion and whether deleted SuperLinea denominations remain reserved.
